import { db } from '@nexuscore/database'
import { OpenAI } from 'openai'
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib'
import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import * as cheerio from 'cheerio'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import axios from 'axios'
import { logger } from '../utils/logger.js'
import type { KnowledgeType } from '@nexuscore/database'

export class DevForgeKnowledgeBase {
  private openai: OpenAI
  private embeddings: OpenAIEmbeddings
  private vectorStore: HNSWLib | null = null
  private textSplitter: RecursiveCharacterTextSplitter

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    })

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    })

    this.initializeVectorStore()
  }

  private async initializeVectorStore() {
    try {
      // Initialize or load existing vector store
      const existingDocs = await this.loadExistingDocuments()
      
      if (existingDocs.length > 0) {
        this.vectorStore = await HNSWLib.fromDocuments(existingDocs, this.embeddings)
        logger.info(`Loaded ${existingDocs.length} documents into vector store`)
      } else {
        // Create empty vector store
        this.vectorStore = new HNSWLib(this.embeddings, {
          space: 'cosine',
          numDimensions: 1536, // text-embedding-3-small dimension
        })
        logger.info('Initialized empty vector store')
      }
    } catch (error) {
      logger.error('Failed to initialize vector store:', error)
    }
  }

  private async loadExistingDocuments(): Promise<Document[]> {
    const knowledgeItems = await db.knowledge.findMany({
      include: {
        author: true,
      },
    })

    return knowledgeItems.map(item => new Document({
      pageContent: item.content,
      metadata: {
        id: item.id,
        title: item.title,
        type: item.type,
        source: item.source,
        author: item.author.email,
        tags: item.tags,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    }))
  }

  async searchKnowledge(args: any) {
    const { query, type, limit = 10 } = args

    try {
      if (!this.vectorStore) {
        throw new Error('Vector store not initialized')
      }

      // Perform semantic search
      const results = await this.vectorStore.similaritySearch(query, limit)
      
      // Filter by type if specified
      const filteredResults = type 
        ? results.filter(doc => doc.metadata.type === type)
        : results

      // Format results for MCP response
      const formattedResults = filteredResults.map(doc => ({
        id: doc.metadata.id,
        title: doc.metadata.title,
        type: doc.metadata.type,
        content: doc.pageContent.substring(0, 500) + '...',
        source: doc.metadata.source,
        author: doc.metadata.author,
        tags: doc.metadata.tags,
        relevanceScore: doc.metadata.score || 1.0,
      }))

      logger.info(`Knowledge search completed: ${formattedResults.length} results for "${query}"`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            resultCount: formattedResults.length,
            results: formattedResults,
          }, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Knowledge search error:', error)
      throw error
    }
  }

  async addKnowledge(args: any) {
    const { title, content, type, tags = [], source, authorId } = args

    try {
      // Generate embeddings for the content
      const embedding = await this.embeddings.embedQuery(content)

      // Store in database
      const knowledgeItem = await db.knowledge.create({
        data: {
          title,
          content,
          type: type as KnowledgeType,
          source: source || 'user_input',
          tags,
          authorId: authorId || 'system', // Default to system if no author specified
          embedding,
        },
      })

      // Add to vector store
      if (this.vectorStore) {
        const doc = new Document({
          pageContent: content,
          metadata: {
            id: knowledgeItem.id,
            title,
            type,
            source: source || 'user_input',
            tags,
          },
        })

        await this.vectorStore.addDocuments([doc])
      }

      logger.info(`Added knowledge item: ${title} (${type})`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            id: knowledgeItem.id,
            title,
            type,
            message: 'Knowledge item added successfully',
          }, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error adding knowledge:', error)
      throw error
    }
  }

  async ingestUrl(url: string, type: KnowledgeType = 'DOCUMENTATION') {
    try {
      logger.info(`Ingesting content from URL: ${url}`)

      const response = await axios.get(url)
      const $ = cheerio.load(response.data)
      
      // Extract text content
      $('script, style, nav, footer, header').remove()
      const title = $('title').text() || $('h1').first().text() || 'Untitled'
      const content = $('body').text().replace(/\s+/g, ' ').trim()

      if (content.length < 100) {
        throw new Error('Insufficient content extracted from URL')
      }

      // Split into chunks
      const chunks = await this.textSplitter.splitText(content)
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkTitle = i === 0 ? title : `${title} (Part ${i + 1})`
        
        await this.addKnowledge({
          title: chunkTitle,
          content: chunks[i],
          type,
          source: url,
          tags: ['web-scraped', 'documentation'],
        })
      }

      logger.info(`Successfully ingested ${chunks.length} chunks from ${url}`)
      return chunks.length
    } catch (error) {
      logger.error(`Error ingesting URL ${url}:`, error)
      throw error
    }
  }

  async ingestPdf(buffer: Buffer, filename: string, type: KnowledgeType = 'DOCUMENTATION') {
    try {
      logger.info(`Ingesting PDF: ${filename}`)

      const pdfData = await pdf(buffer)
      const content = pdfData.text

      if (content.length < 100) {
        throw new Error('Insufficient content extracted from PDF')
      }

      // Split into chunks
      const chunks = await this.textSplitter.splitText(content)
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkTitle = i === 0 ? filename : `${filename} (Part ${i + 1})`
        
        await this.addKnowledge({
          title: chunkTitle,
          content: chunks[i],
          type,
          source: filename,
          tags: ['pdf', 'document'],
        })
      }

      logger.info(`Successfully ingested ${chunks.length} chunks from PDF: ${filename}`)
      return chunks.length
    } catch (error) {
      logger.error(`Error ingesting PDF ${filename}:`, error)
      throw error
    }
  }

  async ingestDocx(buffer: Buffer, filename: string, type: KnowledgeType = 'DOCUMENTATION') {
    try {
      logger.info(`Ingesting DOCX: ${filename}`)

      const result = await mammoth.extractRawText({ buffer })
      const content = result.value

      if (content.length < 100) {
        throw new Error('Insufficient content extracted from DOCX')
      }

      // Split into chunks
      const chunks = await this.textSplitter.splitText(content)
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkTitle = i === 0 ? filename : `${filename} (Part ${i + 1})`
        
        await this.addKnowledge({
          title: chunkTitle,
          content: chunks[i],
          type,
          source: filename,
          tags: ['docx', 'document'],
        })
      }

      logger.info(`Successfully ingested ${chunks.length} chunks from DOCX: ${filename}`)
      return chunks.length
    } catch (error) {
      logger.error(`Error ingesting DOCX ${filename}:`, error)
      throw error
    }
  }

  async getAllDocumentation() {
    try {
      const knowledge = await db.knowledge.findMany({
        include: {
          author: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalItems: knowledge.length,
            documentation: knowledge.map(item => ({
              id: item.id,
              title: item.title,
              type: item.type,
              source: item.source,
              author: `${item.author.firstName} ${item.author.lastName}`.trim() || item.author.email,
              tags: item.tags,
              summary: item.summary,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })),
          }, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error retrieving all documentation:', error)
      throw error
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise summaries of technical documentation. Keep summaries to 2-3 sentences and focus on the key points.',
          },
          {
            role: 'user',
            content: `Please summarize the following content:\n\n${content.substring(0, 4000)}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      })

      return response.choices[0].message.content || 'Summary could not be generated'
    } catch (error) {
      logger.error('Error generating summary:', error)
      return 'Summary generation failed'
    }
  }
}