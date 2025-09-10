import { db } from '@nexuscore/database'
import { logger } from '../utils/logger.js'
import type { WorkflowStatus, ExecutionStatus } from '@nexuscore/database'

export class DevForgeWorkflowEngine {
  async executeWorkflow(args: any) {
    const { workflowName, parameters = {}, environment = 'DEVELOPMENT', userId = 'system' } = args

    try {
      // Find the workflow
      const workflow = await db.workflow.findFirst({
        where: {
          name: {
            equals: workflowName,
            mode: 'insensitive',
          },
          status: 'ACTIVE',
        },
      })

      if (!workflow) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Workflow "${workflowName}" not found or not active`,
              suggestions: await this.getSimilarWorkflowNames(workflowName),
            }, null, 2)
          }]
        }
      }

      // Create workflow execution record
      const execution = await db.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          userId,
          status: 'PENDING',
          input: parameters,
        },
      })

      // Start workflow execution (in a real implementation, this would be async)
      const result = await this.runWorkflow(workflow, parameters, environment, execution.id)

      // Update execution with result
      await db.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: result.status,
          output: result.output,
          logs: result.logs,
          error: result.error,
          duration: result.duration,
          completedAt: result.status !== 'RUNNING' ? new Date() : undefined,
          nodeExecutions: result.nodeExecutions,
        },
      })

      logger.info(`Workflow execution started: ${workflowName} (${execution.id})`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            executionId: execution.id,
            workflowName,
            status: result.status,
            startedAt: execution.startedAt,
            parameters,
            environment,
            message: `Workflow "${workflowName}" execution initiated`,
            logs: result.logs,
          }, null, 2)
        }]
      }
    } catch (error) {
      logger.error(`Error executing workflow ${workflowName}:`, error)
      throw error
    }
  }

  async getWorkflowStatus(args: any) {
    const { executionId } = args

    try {
      const execution = await db.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: {
            select: {
              name: true,
              description: true,
            },
          },
          triggeredBy: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!execution) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Workflow execution "${executionId}" not found`,
            }, null, 2)
          }]
        }
      }

      const statusInfo = {
        executionId: execution.id,
        workflow: {
          name: execution.workflow.name,
          description: execution.workflow.description,
        },
        status: execution.status,
        triggeredBy: `${execution.triggeredBy.firstName} ${execution.triggeredBy.lastName}`.trim() || execution.triggeredBy.email,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.duration,
        input: execution.input,
        output: execution.output,
        logs: execution.logs,
        error: execution.error,
        nodeExecutions: execution.nodeExecutions,
      }

      logger.info(`Retrieved workflow status for execution: ${executionId}`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(statusInfo, null, 2)
        }]
      }
    } catch (error) {
      logger.error(`Error getting workflow status for ${executionId}:`, error)
      throw error
    }
  }

  async getActiveWorkflows() {
    try {
      const activeExecutions = await db.workflowExecution.findMany({
        where: {
          status: {
            in: ['PENDING', 'RUNNING'],
          },
        },
        include: {
          workflow: {
            select: {
              name: true,
              description: true,
            },
          },
          triggeredBy: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 50,
      })

      const recentExecutions = await db.workflowExecution.findMany({
        where: {
          status: {
            in: ['SUCCESS', 'FAILED', 'CANCELLED'],
          },
          completedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          workflow: {
            select: {
              name: true,
              description: true,
            },
          },
          triggeredBy: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 100,
      })

      const workflowData = {
        activeExecutions: activeExecutions.map(execution => ({
          executionId: execution.id,
          workflowName: execution.workflow.name,
          status: execution.status,
          triggeredBy: `${execution.triggeredBy.firstName} ${execution.triggeredBy.lastName}`.trim() || execution.triggeredBy.email,
          startedAt: execution.startedAt,
          duration: execution.duration,
        })),
        recentExecutions: recentExecutions.map(execution => ({
          executionId: execution.id,
          workflowName: execution.workflow.name,
          status: execution.status,
          triggeredBy: `${execution.triggeredBy.firstName} ${execution.triggeredBy.lastName}`.trim() || execution.triggeredBy.email,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          duration: execution.duration,
        })),
        summary: {
          activeCount: activeExecutions.length,
          recentCount: recentExecutions.length,
          successRate: recentExecutions.length > 0 
            ? (recentExecutions.filter(e => e.status === 'SUCCESS').length / recentExecutions.length) * 100
            : 0,
        },
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(workflowData, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error getting active workflows:', error)
      throw error
    }
  }

  private async runWorkflow(workflow: any, parameters: any, environment: string, executionId: string) {
    const startTime = Date.now()
    const logs: string[] = []
    const nodeExecutions: any[] = []

    try {
      logs.push(`Starting workflow: ${workflow.name}`)
      logs.push(`Environment: ${environment}`)
      logs.push(`Parameters: ${JSON.stringify(parameters)}`)

      // Parse workflow definition
      const definition = workflow.definition as any
      const nodes = definition.nodes || []
      const edges = definition.edges || []

      if (nodes.length === 0) {
        throw new Error('Workflow has no nodes defined')
      }

      // Simple workflow execution - in reality this would be much more complex
      // with proper graph traversal, parallel execution, error handling, etc.
      
      for (const node of nodes) {
        const nodeStart = Date.now()
        logs.push(`Executing node: ${node.name} (${node.type})`)
        
        try {
          const nodeResult = await this.executeNode(node, parameters, environment)
          const nodeEnd = Date.now()
          
          nodeExecutions.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            status: 'SUCCESS',
            startedAt: new Date(nodeStart),
            completedAt: new Date(nodeEnd),
            duration: nodeEnd - nodeStart,
            output: nodeResult,
          })
          
          logs.push(`Node completed successfully: ${node.name}`)
          
          // Merge node output into parameters for next nodes
          if (nodeResult && typeof nodeResult === 'object') {
            Object.assign(parameters, nodeResult)
          }
        } catch (nodeError) {
          const nodeEnd = Date.now()
          
          nodeExecutions.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            status: 'FAILED',
            startedAt: new Date(nodeStart),
            completedAt: new Date(nodeEnd),
            duration: nodeEnd - nodeStart,
            error: nodeError instanceof Error ? nodeError.message : String(nodeError),
          })
          
          logs.push(`Node failed: ${node.name} - ${nodeError instanceof Error ? nodeError.message : String(nodeError)}`)
          
          // If node is critical, fail the entire workflow
          if (node.critical !== false) {
            throw nodeError
          }
        }
      }

      const endTime = Date.now()
      logs.push(`Workflow completed successfully in ${endTime - startTime}ms`)

      return {
        status: 'SUCCESS' as ExecutionStatus,
        output: parameters,
        logs,
        duration: endTime - startTime,
        nodeExecutions,
      }
    } catch (error) {
      const endTime = Date.now()
      logs.push(`Workflow failed: ${error instanceof Error ? error.message : String(error)}`)

      return {
        status: 'FAILED' as ExecutionStatus,
        output: parameters,
        logs,
        error: error instanceof Error ? error.message : String(error),
        duration: endTime - startTime,
        nodeExecutions,
      }
    }
  }

  private async executeNode(node: any, parameters: any, environment: string): Promise<any> {
    // Mock node execution based on node type
    switch (node.type) {
      case 'deploy':
        // Simulate deployment
        await this.delay(2000)
        return {
          deploymentId: `deploy-${Date.now()}`,
          environment,
          status: 'deployed',
        }

      case 'test':
        // Simulate testing
        await this.delay(1000)
        const success = Math.random() > 0.1 // 90% success rate
        if (!success) {
          throw new Error('Tests failed')
        }
        return {
          testResults: {
            passed: 45,
            failed: 0,
            skipped: 2,
          },
        }

      case 'notification':
        // Simulate notification
        await this.delay(500)
        return {
          notificationSent: true,
          recipients: ['team@example.com'],
        }

      case 'approval':
        // Simulate approval (auto-approve for now)
        await this.delay(1000)
        return {
          approved: true,
          approver: 'system',
        }

      case 'script':
        // Execute custom script
        await this.delay(1500)
        return {
          scriptOutput: 'Script executed successfully',
          exitCode: 0,
        }

      default:
        // Generic node execution
        await this.delay(500)
        return {
          nodeType: node.type,
          executed: true,
        }
    }
  }

  private async getSimilarWorkflowNames(workflowName: string): Promise<string[]> {
    const allWorkflows = await db.workflow.findMany({
      select: {
        name: true,
      },
      where: {
        status: 'ACTIVE',
      },
    })

    // Simple similarity check
    const similar = allWorkflows
      .map(w => w.name)
      .filter(name => 
        name.toLowerCase().includes(workflowName.toLowerCase()) ||
        workflowName.toLowerCase().includes(name.toLowerCase())
      )
      .slice(0, 5)

    return similar
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}