import { db } from '@nexuscore/database'
import { logger } from '../utils/logger.js'

export class DevForgeServiceCatalog {
  async getServiceInfo(args: any) {
    const { serviceName } = args

    try {
      const service = await db.service.findFirst({
        where: {
          name: {
            equals: serviceName,
            mode: 'insensitive',
          },
        },
        include: {
          owner: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          dependsOn: {
            include: {
              dependsOn: {
                select: {
                  name: true,
                  type: true,
                  status: true,
                },
              },
            },
          },
          dependents: {
            include: {
              service: {
                select: {
                  name: true,
                  type: true,
                  status: true,
                },
              },
            },
          },
          metrics: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
            orderBy: {
              timestamp: 'desc',
            },
            take: 100,
          },
          deployments: {
            orderBy: {
              startedAt: 'desc',
            },
            take: 10,
          },
          incidents: {
            where: {
              status: {
                in: ['OPEN', 'INVESTIGATING'],
              },
            },
            orderBy: {
              detectedAt: 'desc',
            },
          },
          scorecards: {
            include: {
              scorecard: {
                select: {
                  name: true,
                  description: true,
                },
              },
            },
            orderBy: {
              calculatedAt: 'desc',
            },
            take: 1,
          },
        },
      })

      if (!service) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Service "${serviceName}" not found`,
              suggestions: await this.getSimilarServiceNames(serviceName),
            }, null, 2)
          }]
        }
      }

      // Calculate health score
      const healthScore = this.calculateHealthScore(service)
      
      // Get recent performance metrics
      const performanceMetrics = this.aggregateMetrics(service.metrics)

      const serviceInfo = {
        basic: {
          id: service.id,
          name: service.name,
          displayName: service.displayName,
          description: service.description,
          type: service.type,
          status: service.status,
          language: service.language,
          framework: service.framework,
          tags: service.tags,
        },
        repository: {
          url: service.repositoryUrl,
          branch: service.branch,
        },
        team: {
          name: service.owner.name,
          displayName: service.owner.displayName,
          members: service.owner.members.map(member => ({
            name: `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email,
            email: member.user.email,
            role: member.role,
          })),
        },
        dependencies: {
          dependsOn: service.dependsOn.map(dep => ({
            name: dep.dependsOn.name,
            type: dep.dependsOn.type,
            status: dep.dependsOn.status,
            dependencyType: dep.type,
            description: dep.description,
          })),
          dependents: service.dependents.map(dep => ({
            name: dep.service.name,
            type: dep.service.type,
            status: dep.service.status,
            dependencyType: dep.type,
            description: dep.description,
          })),
        },
        health: {
          score: healthScore,
          activeIncidents: service.incidents.length,
          incidents: service.incidents.map(incident => ({
            id: incident.id,
            title: incident.title,
            severity: incident.severity,
            status: incident.status,
            detectedAt: incident.detectedAt,
          })),
        },
        performance: performanceMetrics,
        deployments: {
          recent: service.deployments.map(deployment => ({
            id: deployment.id,
            version: deployment.version,
            environment: deployment.environment,
            status: deployment.status,
            startedAt: deployment.startedAt,
            completedAt: deployment.completedAt,
            duration: deployment.duration,
          })),
        },
        scorecards: service.scorecards.map(scorecard => ({
          name: scorecard.scorecard.name,
          description: scorecard.scorecard.description,
          score: scorecard.score,
          maxScore: scorecard.maxScore,
          percentage: scorecard.percentage,
          calculatedAt: scorecard.calculatedAt,
        })),
        visualization: {
          position: service.position,
          color: service.color,
          size: service.size,
        },
      }

      logger.info(`Retrieved service info for: ${serviceName}`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(serviceInfo, null, 2)
        }]
      }
    } catch (error) {
      logger.error(`Error getting service info for ${serviceName}:`, error)
      throw error
    }
  }

  async listServices(args: any = {}) {
    const { team, type, status, language, limit = 50 } = args

    try {
      const whereClause: any = {}

      if (team) {
        whereClause.owner = {
          name: {
            equals: team,
            mode: 'insensitive',
          },
        }
      }

      if (type) {
        whereClause.type = type
      }

      if (status) {
        whereClause.status = status
      }

      if (language) {
        whereClause.language = {
          has: language,
        }
      }

      const services = await db.service.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              name: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              dependsOn: true,
              dependents: true,
              incidents: {
                where: {
                  status: {
                    in: ['OPEN', 'INVESTIGATING'],
                  },
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          name: 'asc',
        },
      })

      const serviceList = services.map(service => ({
        id: service.id,
        name: service.name,
        displayName: service.displayName,
        description: service.description,
        type: service.type,
        status: service.status,
        language: service.language,
        framework: service.framework,
        team: {
          name: service.owner.name,
          displayName: service.owner.displayName,
        },
        dependencyCount: service._count.dependsOn,
        dependentCount: service._count.dependents,
        activeIncidents: service._count.incidents,
        tags: service.tags,
        healthScore: this.calculateHealthScore(service),
      }))

      logger.info(`Listed ${serviceList.length} services with filters:`, { team, type, status, language })

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalCount: serviceList.length,
            filters: { team, type, status, language },
            services: serviceList,
          }, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error listing services:', error)
      throw error
    }
  }

  async getServiceDependencies(args: any) {
    const { serviceName, depth = 2 } = args

    try {
      const dependencyGraph = await this.buildDependencyGraph(serviceName, depth)

      logger.info(`Built dependency graph for ${serviceName} with depth ${depth}`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            rootService: serviceName,
            depth,
            graph: dependencyGraph,
          }, null, 2)
        }]
      }
    } catch (error) {
      logger.error(`Error getting dependencies for ${serviceName}:`, error)
      throw error
    }
  }

  private async buildDependencyGraph(serviceName: string, depth: number, visited = new Set<string>()): Promise<any> {
    if (depth <= 0 || visited.has(serviceName)) {
      return null
    }

    visited.add(serviceName)

    const service = await db.service.findFirst({
      where: {
        name: {
          equals: serviceName,
          mode: 'insensitive',
        },
      },
      include: {
        dependsOn: {
          include: {
            dependsOn: {
              select: {
                name: true,
                type: true,
                status: true,
              },
            },
          },
        },
        dependents: {
          include: {
            service: {
              select: {
                name: true,
                type: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!service) {
      return null
    }

    const dependencies = []
    const dependents = []

    // Build downstream dependencies
    for (const dep of service.dependsOn) {
      const childGraph = await this.buildDependencyGraph(dep.dependsOn.name, depth - 1, visited)
      dependencies.push({
        service: dep.dependsOn,
        type: dep.type,
        description: dep.description,
        children: childGraph,
      })
    }

    // Build upstream dependents
    for (const dep of service.dependents) {
      const childGraph = await this.buildDependencyGraph(dep.service.name, depth - 1, visited)
      dependents.push({
        service: dep.service,
        type: dep.type,
        description: dep.description,
        children: childGraph,
      })
    }

    return {
      service: {
        name: service.name,
        type: service.type,
        status: service.status,
      },
      dependencies,
      dependents,
    }
  }

  private calculateHealthScore(service: any): number {
    let score = 100

    // Deduct points for incidents
    if (service.incidents) {
      score -= service.incidents.length * 20
    } else if (service._count?.incidents) {
      score -= service._count.incidents * 20
    }

    // Deduct points for deprecated status
    if (service.status === 'DEPRECATED') {
      score -= 30
    } else if (service.status === 'MAINTENANCE') {
      score -= 15
    }

    // Deduct points for old deployments (if deployment data is available)
    if (service.deployments && service.deployments.length > 0) {
      const lastDeployment = service.deployments[0]
      const daysSinceLastDeploy = (Date.now() - new Date(lastDeployment.startedAt).getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceLastDeploy > 30) {
        score -= 10
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  private aggregateMetrics(metrics: any[]): any {
    if (!metrics || metrics.length === 0) {
      return {
        responseTime: { average: null, trend: 'unknown' },
        errorRate: { average: null, trend: 'unknown' },
        throughput: { average: null, trend: 'unknown' },
      }
    }

    const responseTimeMetrics = metrics.filter(m => m.name === 'response_time')
    const errorRateMetrics = metrics.filter(m => m.name === 'error_rate')
    const throughputMetrics = metrics.filter(m => m.name === 'throughput')

    return {
      responseTime: {
        average: responseTimeMetrics.length > 0 
          ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
          : null,
        trend: this.calculateTrend(responseTimeMetrics),
        unit: 'ms',
      },
      errorRate: {
        average: errorRateMetrics.length > 0 
          ? errorRateMetrics.reduce((sum, m) => sum + m.value, 0) / errorRateMetrics.length
          : null,
        trend: this.calculateTrend(errorRateMetrics),
        unit: '%',
      },
      throughput: {
        average: throughputMetrics.length > 0 
          ? throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length
          : null,
        trend: this.calculateTrend(throughputMetrics),
        unit: 'req/s',
      },
    }
  }

  private calculateTrend(metrics: any[]): string {
    if (metrics.length < 2) {
      return 'unknown'
    }

    const sortedMetrics = metrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2))
    const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2))

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }

  private async getSimilarServiceNames(serviceName: string): Promise<string[]> {
    const allServices = await db.service.findMany({
      select: {
        name: true,
      },
    })

    // Simple similarity check based on string matching
    const similar = allServices
      .map(s => s.name)
      .filter(name => 
        name.toLowerCase().includes(serviceName.toLowerCase()) ||
        serviceName.toLowerCase().includes(name.toLowerCase())
      )
      .slice(0, 5)

    return similar
  }

  async getFullCatalog() {
    try {
      const services = await db.service.findMany({
        include: {
          owner: {
            select: {
              name: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              dependsOn: true,
              dependents: true,
              incidents: {
                where: {
                  status: {
                    in: ['OPEN', 'INVESTIGATING'],
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })

      const catalog = {
        totalServices: services.length,
        servicesByType: this.groupByType(services),
        servicesByStatus: this.groupByStatus(services),
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          displayName: service.displayName,
          type: service.type,
          status: service.status,
          team: service.owner.displayName,
          language: service.language,
          framework: service.framework,
          dependencyCount: service._count.dependsOn,
          dependentCount: service._count.dependents,
          activeIncidents: service._count.incidents,
          healthScore: this.calculateHealthScore(service),
        })),
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(catalog, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error getting full catalog:', error)
      throw error
    }
  }

  private groupByType(services: any[]) {
    const groups: Record<string, number> = {}
    services.forEach(service => {
      groups[service.type] = (groups[service.type] || 0) + 1
    })
    return groups
  }

  private groupByStatus(services: any[]) {
    const groups: Record<string, number> = {}
    services.forEach(service => {
      groups[service.status] = (groups[service.status] || 0) + 1
    })
    return groups
  }
}