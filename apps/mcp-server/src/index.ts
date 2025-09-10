#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { DevForgeKnowledgeBase } from './knowledge/knowledge-base.js'
import { DevForgeServiceCatalog } from './services/service-catalog.js'
import { DevForgeWorkflowEngine } from './workflows/workflow-engine.js'
import { DevForgeAnalytics } from './analytics/analytics.js'
import { logger } from './utils/logger.js'

export class DevForgeMCPServer {
  private server: Server
  private knowledgeBase: DevForgeKnowledgeBase
  private serviceCatalog: DevForgeServiceCatalog
  private workflowEngine: DevForgeWorkflowEngine
  private analytics: DevForgeAnalytics

  constructor() {
    this.server = new Server(
      {
        name: 'devforge-mcp-server',
        version: '1.0.0',
        description: 'DevForge AI-powered platform engineering assistant with comprehensive knowledge management',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    )

    this.knowledgeBase = new DevForgeKnowledgeBase()
    this.serviceCatalog = new DevForgeServiceCatalog()
    this.workflowEngine = new DevForgeWorkflowEngine()
    this.analytics = new DevForgeAnalytics()

    this.setupToolHandlers()
    this.setupResourceHandlers()
  }

  private setupToolHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Knowledge Management Tools
          {
            name: 'search_knowledge',
            description: 'Search through documentation, runbooks, and knowledge base using semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for finding relevant documentation and knowledge',
                },
                type: {
                  type: 'string',
                  enum: ['DOCUMENTATION', 'RUNBOOK', 'FAQ', 'TUTORIAL', 'API_REFERENCE', 'TROUBLESHOOTING'],
                  description: 'Type of knowledge to search for',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'add_knowledge',
            description: 'Add new documentation or knowledge to the knowledge base',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Title of the knowledge item' },
                content: { type: 'string', description: 'Content of the knowledge item' },
                type: {
                  type: 'string',
                  enum: ['DOCUMENTATION', 'RUNBOOK', 'FAQ', 'TUTORIAL', 'API_REFERENCE', 'TROUBLESHOOTING'],
                  description: 'Type of knowledge being added',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags to categorize the knowledge',
                },
                source: { type: 'string', description: 'Source of the knowledge (URL, document name, etc.)' },
              },
              required: ['title', 'content', 'type'],
            },
          },

          // Service Catalog Tools
          {
            name: 'get_service_info',
            description: 'Get detailed information about a specific service',
            inputSchema: {
              type: 'object',
              properties: {
                serviceName: { type: 'string', description: 'Name of the service to get information about' },
              },
              required: ['serviceName'],
            },
          },
          {
            name: 'list_services',
            description: 'List all services with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                team: { type: 'string', description: 'Filter services by team' },
                type: {
                  type: 'string',
                  enum: ['SERVICE', 'DATABASE', 'QUEUE', 'API_GATEWAY', 'LOAD_BALANCER'],
                  description: 'Filter services by type',
                },
                status: {
                  type: 'string',
                  enum: ['ACTIVE', 'DEPRECATED', 'ARCHIVED', 'MAINTENANCE'],
                  description: 'Filter services by status',
                },
                language: { type: 'string', description: 'Filter services by programming language' },
              },
            },
          },
          {
            name: 'get_service_dependencies',
            description: 'Get dependency graph for a service',
            inputSchema: {
              type: 'object',
              properties: {
                serviceName: { type: 'string', description: 'Name of the service' },
                depth: { type: 'number', description: 'Depth of dependency traversal (default: 2)', default: 2 },
              },
              required: ['serviceName'],
            },
          },

          // Workflow and Automation Tools
          {
            name: 'execute_workflow',
            description: 'Execute a predefined workflow or action',
            inputSchema: {
              type: 'object',
              properties: {
                workflowName: { type: 'string', description: 'Name of the workflow to execute' },
                parameters: {
                  type: 'object',
                  description: 'Parameters to pass to the workflow',
                },
                environment: {
                  type: 'string',
                  enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
                  description: 'Target environment for the workflow',
                },
              },
              required: ['workflowName'],
            },
          },
          {
            name: 'get_workflow_status',
            description: 'Get the status and logs of a workflow execution',
            inputSchema: {
              type: 'object',
              properties: {
                executionId: { type: 'string', description: 'ID of the workflow execution' },
              },
              required: ['executionId'],
            },
          },

          // Analytics and Monitoring Tools
          {
            name: 'get_service_metrics',
            description: 'Get performance metrics for a service',
            inputSchema: {
              type: 'object',
              properties: {
                serviceName: { type: 'string', description: 'Name of the service' },
                timeRange: {
                  type: 'string',
                  enum: ['1h', '6h', '24h', '7d', '30d'],
                  description: 'Time range for metrics (default: 24h)',
                  default: '24h',
                },
                metrics: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['response_time', 'error_rate', 'throughput', 'cpu_usage', 'memory_usage'],
                  },
                  description: 'Specific metrics to retrieve',
                },
              },
              required: ['serviceName'],
            },
          },
          {
            name: 'get_incidents',
            description: 'Get current and recent incidents',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
                  description: 'Filter incidents by status',
                },
                severity: {
                  type: 'string',
                  enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                  description: 'Filter incidents by severity',
                },
                serviceName: { type: 'string', description: 'Filter incidents by service' },
                limit: { type: 'number', description: 'Maximum number of incidents to return', default: 20 },
              },
            },
          },

          // Platform Intelligence Tools
          {
            name: 'analyze_platform_health',
            description: 'Analyze overall platform health and provide recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                includeRecommendations: {
                  type: 'boolean',
                  description: 'Include AI-powered recommendations',
                  default: true,
                },
                focusAreas: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['security', 'performance', 'reliability', 'cost', 'compliance'],
                  },
                  description: 'Specific areas to focus the analysis on',
                },
              },
            },
          },
          {
            name: 'natural_language_query',
            description: 'Execute natural language queries against the platform data',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language query (e.g., "Show me services with high error rates", "What deployments happened today?")',
                },
              },
              required: ['query'],
            },
          },
        ],
      }
    })

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'search_knowledge':
            return await this.knowledgeBase.searchKnowledge(args)
          
          case 'add_knowledge':
            return await this.knowledgeBase.addKnowledge(args)
          
          case 'get_service_info':
            return await this.serviceCatalog.getServiceInfo(args)
          
          case 'list_services':
            return await this.serviceCatalog.listServices(args)
          
          case 'get_service_dependencies':
            return await this.serviceCatalog.getServiceDependencies(args)
          
          case 'execute_workflow':
            return await this.workflowEngine.executeWorkflow(args)
          
          case 'get_workflow_status':
            return await this.workflowEngine.getWorkflowStatus(args)
          
          case 'get_service_metrics':
            return await this.analytics.getServiceMetrics(args)
          
          case 'get_incidents':
            return await this.analytics.getIncidents(args)
          
          case 'analyze_platform_health':
            return await this.analytics.analyzePlatformHealth(args)
          
          case 'natural_language_query':
            return await this.handleNaturalLanguageQuery(args)
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            )
        }
      } catch (error) {
        logger.error('Tool execution error:', error)
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'devforge://knowledge/documentation',
            name: 'Documentation',
            description: 'Access to all documentation in the knowledge base',
            mimeType: 'application/json',
          },
          {
            uri: 'devforge://services/catalog',
            name: 'Service Catalog',
            description: 'Complete service catalog with dependencies and metadata',
            mimeType: 'application/json',
          },
          {
            uri: 'devforge://metrics/dashboard',
            name: 'Platform Metrics',
            description: 'Real-time platform metrics and health data',
            mimeType: 'application/json',
          },
          {
            uri: 'devforge://workflows/active',
            name: 'Active Workflows',
            description: 'Currently running and recent workflow executions',
            mimeType: 'application/json',
          },
        ],
      }
    })

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params

      try {
        switch (uri) {
          case 'devforge://knowledge/documentation':
            return await this.knowledgeBase.getAllDocumentation()
          
          case 'devforge://services/catalog':
            return await this.serviceCatalog.getFullCatalog()
          
          case 'devforge://metrics/dashboard':
            return await this.analytics.getDashboardMetrics()
          
          case 'devforge://workflows/active':
            return await this.workflowEngine.getActiveWorkflows()
          
          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Unknown resource: ${uri}`
            )
        }
      } catch (error) {
        logger.error('Resource access error:', error)
        throw new McpError(
          ErrorCode.InternalError,
          `Error accessing resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })
  }

  private async handleNaturalLanguageQuery(args: any) {
    // This would use an LLM to interpret natural language queries
    // and convert them to appropriate API calls
    const query = args.query as string
    
    logger.info(`Processing natural language query: ${query}`)
    
    // For now, return a mock response
    return {
      content: [{
        type: 'text',
        text: `Natural language query processing is not yet implemented. Query was: "${query}"`
      }]
    }
  }

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    
    logger.info('DevForge MCP Server started successfully')
    logger.info('Available tools:', {
      knowledge: ['search_knowledge', 'add_knowledge'],
      services: ['get_service_info', 'list_services', 'get_service_dependencies'],
      workflows: ['execute_workflow', 'get_workflow_status'],
      analytics: ['get_service_metrics', 'get_incidents', 'analyze_platform_health'],
      intelligence: ['natural_language_query']
    })
  }

  async stop() {
    await this.server.close()
    logger.info('DevForge MCP Server stopped')
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new DevForgeMCPServer()
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...')
    await server.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...')
    await server.stop()
    process.exit(0)
  })

  server.start().catch((error) => {
    logger.error('Failed to start server:', error)
    process.exit(1)
  })
}