import { db } from '@nexuscore/database'
import { logger } from '../utils/logger.js'

export class DevForgeAnalytics {
  async getServiceMetrics(args: any) {
    const { serviceName, timeRange = '24h', metrics = [] } = args

    try {
      // Calculate time range
      const timeRangeMs = this.parseTimeRange(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs)

      // Find service
      const service = await db.service.findFirst({
        where: {
          name: {
            equals: serviceName,
            mode: 'insensitive',
          },
        },
      })

      if (!service) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Service "${serviceName}" not found`,
            }, null, 2)
          }]
        }
      }

      // Build metrics filter
      const metricsFilter = metrics.length > 0 ? { name: { in: metrics } } : {}

      // Get metrics data
      const metricsData = await db.metric.findMany({
        where: {
          serviceId: service.id,
          timestamp: {
            gte: startTime,
          },
          ...metricsFilter,
        },
        orderBy: {
          timestamp: 'asc',
        },
      })

      // Aggregate metrics by type
      const aggregatedMetrics = this.aggregateMetrics(metricsData, timeRange)

      // Calculate performance scores
      const performanceScores = this.calculatePerformanceScores(aggregatedMetrics)

      const result = {
        service: {
          name: service.name,
          id: service.id,
        },
        timeRange,
        period: {
          start: startTime,
          end: new Date(),
        },
        metrics: aggregatedMetrics,
        performance: performanceScores,
        insights: this.generateMetricsInsights(aggregatedMetrics),
      }

      logger.info(`Retrieved metrics for service: ${serviceName}`)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    } catch (error) {
      logger.error(`Error getting metrics for ${serviceName}:`, error)
      throw error
    }
  }

  async getIncidents(args: any = {}) {
    const { status, severity, serviceName, limit = 20 } = args

    try {
      const whereClause: any = {}

      if (status) {
        whereClause.status = status
      }

      if (severity) {
        whereClause.severity = severity
      }

      if (serviceName) {
        whereClause.service = {
          name: {
            equals: serviceName,
            mode: 'insensitive',
          },
        }
      }

      const incidents = await db.incident.findMany({
        where: whereClause,
        include: {
          service: {
            select: {
              name: true,
              type: true,
              owner: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          detectedAt: 'desc',
        },
        take: limit,
      })

      const incidentData = {
        totalCount: incidents.length,
        filters: { status, severity, serviceName },
        incidents: incidents.map(incident => ({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          service: {
            name: incident.service.name,
            type: incident.service.type,
            team: incident.service.owner.displayName,
          },
          timeline: {
            detectedAt: incident.detectedAt,
            resolvedAt: incident.resolvedAt,
            duration: incident.duration,
          },
          impact: this.calculateIncidentImpact(incident),
        })),
        summary: this.generateIncidentSummary(incidents),
      }

      logger.info(`Retrieved ${incidents.length} incidents with filters:`, { status, severity, serviceName })

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(incidentData, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error getting incidents:', error)
      throw error
    }
  }

  async analyzePlatformHealth(args: any = {}) {
    const { includeRecommendations = true, focusAreas = [] } = args

    try {
      // Get overall platform statistics
      const stats = await this.getPlatformStats()
      
      // Get service health scores
      const serviceHealth = await this.getServiceHealthScores()
      
      // Get recent incidents
      const recentIncidents = await db.incident.findMany({
        where: {
          detectedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          service: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      })

      // Get deployment success rate
      const deploymentStats = await this.getDeploymentStats()

      // Calculate health scores by focus area
      const healthScores = this.calculateHealthScores(stats, serviceHealth, recentIncidents, deploymentStats)

      // Generate recommendations if requested
      const recommendations = includeRecommendations 
        ? await this.generateRecommendations(healthScores, focusAreas)
        : []

      const analysis = {
        overall: {
          score: this.calculateOverallHealthScore(healthScores),
          status: this.determineHealthStatus(healthScores),
          lastUpdated: new Date(),
        },
        categories: healthScores,
        statistics: stats,
        trends: {
          incidents: this.analyzeIncidentTrends(recentIncidents),
          deployments: deploymentStats,
          services: serviceHealth.summary,
        },
        recommendations: includeRecommendations ? recommendations : undefined,
        insights: this.generatePlatformInsights(healthScores, stats),
      }

      logger.info('Platform health analysis completed')

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error analyzing platform health:', error)
      throw error
    }
  }

  async getDashboardMetrics() {
    try {
      // Get key metrics for dashboard
      const [
        serviceCount,
        activeIncidents,
        recentDeployments,
        platformMetrics
      ] = await Promise.all([
        this.getServiceCount(),
        this.getActiveIncidentsCount(),
        this.getRecentDeployments(),
        this.getPlatformMetrics()
      ])

      const dashboard = {
        timestamp: new Date(),
        services: serviceCount,
        incidents: activeIncidents,
        deployments: recentDeployments,
        performance: platformMetrics,
        alerts: await this.getActiveAlerts(),
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(dashboard, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Error getting dashboard metrics:', error)
      throw error
    }
  }

  private parseTimeRange(timeRange: string): number {
    const timeRangeMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }

    return timeRangeMap[timeRange] || timeRangeMap['24h']
  }

  private aggregateMetrics(metrics: any[], timeRange: string) {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric)
      return acc
    }, {} as Record<string, any[]>)

    const aggregated: Record<string, any> = {}

    for (const [metricName, metricData] of Object.entries(grouped)) {
      const values = metricData.map(m => m.value)
      aggregated[metricName] = {
        current: values[values.length - 1] || 0,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        trend: this.calculateTrend(metricData),
        dataPoints: metricData.length,
        unit: metricData[0]?.unit || '',
        timeseries: metricData.map(m => ({
          timestamp: m.timestamp,
          value: m.value,
        })),
      }
    }

    return aggregated
  }

  private calculateTrend(metrics: any[]): string {
    if (metrics.length < 2) return 'stable'

    const sorted = metrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
  }

  private calculatePerformanceScores(metrics: Record<string, any>) {
    const scores: Record<string, number> = {}

    // Response time score (lower is better)
    if (metrics.response_time) {
      const avgResponseTime = metrics.response_time.average
      scores.responseTime = Math.max(0, 100 - (avgResponseTime / 10)) // 100 points if < 10ms, 0 if > 1000ms
    }

    // Error rate score (lower is better)
    if (metrics.error_rate) {
      const avgErrorRate = metrics.error_rate.average
      scores.errorRate = Math.max(0, 100 - (avgErrorRate * 10)) // 100 points if 0%, 0 if > 10%
    }

    // Throughput score (higher is better, but with diminishing returns)
    if (metrics.throughput) {
      const avgThroughput = metrics.throughput.average
      scores.throughput = Math.min(100, Math.log10(avgThroughput + 1) * 50) // Logarithmic scale
    }

    return scores
  }

  private generateMetricsInsights(metrics: Record<string, any>) {
    const insights: string[] = []

    for (const [name, data] of Object.entries(metrics)) {
      if (data.trend === 'increasing' && name === 'error_rate') {
        insights.push(`Error rate is increasing (${data.trend}). Current: ${data.current}${data.unit}`)
      }
      
      if (data.trend === 'increasing' && name === 'response_time') {
        insights.push(`Response time is degrading (${data.trend}). Average: ${data.average.toFixed(2)}${data.unit}`)
      }
      
      if (data.current > data.average * 1.5) {
        insights.push(`Current ${name} (${data.current}${data.unit}) is significantly above average (${data.average.toFixed(2)}${data.unit})`)
      }
    }

    return insights
  }

  private calculateIncidentImpact(incident: any) {
    let impact = 0
    
    // Severity impact
    const severityScores = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    impact += severityScores[incident.severity as keyof typeof severityScores] || 1
    
    // Duration impact
    if (incident.duration) {
      const hours = incident.duration / (1000 * 60 * 60)
      impact += Math.min(10, hours / 2) // Up to 10 points for duration
    }
    
    return {
      score: Math.round(impact),
      level: impact < 3 ? 'low' : impact < 6 ? 'medium' : 'high'
    }
  }

  private generateIncidentSummary(incidents: any[]) {
    const summary = {
      total: incidents.length,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      avgResolutionTime: 0,
      activeCount: 0,
    }

    incidents.forEach(incident => {
      // Count by severity
      summary.bySeverity[incident.severity] = (summary.bySeverity[incident.severity] || 0) + 1
      
      // Count by status
      summary.byStatus[incident.status] = (summary.byStatus[incident.status] || 0) + 1
      
      // Count active incidents
      if (['OPEN', 'INVESTIGATING'].includes(incident.status)) {
        summary.activeCount++
      }
    })

    // Calculate average resolution time for resolved incidents
    const resolvedIncidents = incidents.filter(i => i.duration)
    if (resolvedIncidents.length > 0) {
      const totalDuration = resolvedIncidents.reduce((sum, i) => sum + (i.duration || 0), 0)
      summary.avgResolutionTime = Math.round(totalDuration / resolvedIncidents.length / (1000 * 60)) // in minutes
    }

    return summary
  }

  private async getPlatformStats() {
    const [serviceCount, teamCount, userCount] = await Promise.all([
      db.service.count(),
      db.team.count(),
      db.user.count(),
    ])

    return {
      services: serviceCount,
      teams: teamCount,
      users: userCount,
    }
  }

  private async getServiceHealthScores() {
    const services = await db.service.findMany({
      include: {
        _count: {
          select: {
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
    })

    const healthScores = services.map(service => ({
      name: service.name,
      score: this.calculateServiceHealth(service),
      status: service.status,
      activeIncidents: service._count.incidents,
    }))

    return {
      services: healthScores,
      summary: {
        average: healthScores.reduce((sum, s) => sum + s.score, 0) / healthScores.length,
        healthy: healthScores.filter(s => s.score > 80).length,
        warning: healthScores.filter(s => s.score >= 60 && s.score <= 80).length,
        critical: healthScores.filter(s => s.score < 60).length,
      },
    }
  }

  private calculateServiceHealth(service: any): number {
    let score = 100

    // Deduct for active incidents
    if (service._count?.incidents) {
      score -= service._count.incidents * 20
    }

    // Deduct for service status
    if (service.status === 'DEPRECATED') score -= 30
    if (service.status === 'MAINTENANCE') score -= 15

    return Math.max(0, score)
  }

  private async getDeploymentStats() {
    const deployments = await db.deployment.findMany({
      where: {
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    })

    const total = deployments.length
    const successful = deployments.filter(d => d.status === 'SUCCESS').length
    const failed = deployments.filter(d => d.status === 'FAILED').length

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    }
  }

  private calculateHealthScores(stats: any, serviceHealth: any, incidents: any[], deployments: any) {
    return {
      security: {
        score: Math.max(0, 100 - (incidents.filter(i => i.title?.toLowerCase().includes('security')).length * 10)),
        status: 'good',
      },
      performance: {
        score: serviceHealth.summary.average,
        status: serviceHealth.summary.average > 80 ? 'good' : serviceHealth.summary.average > 60 ? 'warning' : 'critical',
      },
      reliability: {
        score: deployments.successRate,
        status: deployments.successRate > 95 ? 'good' : deployments.successRate > 85 ? 'warning' : 'critical',
      },
      cost: {
        score: 85, // Mock score - would be calculated from actual cost data
        status: 'good',
      },
      compliance: {
        score: 90, // Mock score - would be calculated from compliance checks
        status: 'good',
      },
    }
  }

  private calculateOverallHealthScore(healthScores: any): number {
    const scores = Object.values(healthScores).map((category: any) => category.score)
    return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
  }

  private determineHealthStatus(healthScores: any): string {
    const overallScore = this.calculateOverallHealthScore(healthScores)
    
    if (overallScore >= 90) return 'excellent'
    if (overallScore >= 80) return 'good'
    if (overallScore >= 70) return 'fair'
    if (overallScore >= 60) return 'poor'
    return 'critical'
  }

  private async generateRecommendations(healthScores: any, focusAreas: string[]) {
    const recommendations: string[] = []

    for (const [category, data] of Object.entries(healthScores) as [string, any][]) {
      if (focusAreas.length > 0 && !focusAreas.includes(category)) {
        continue
      }

      if (data.score < 80) {
        switch (category) {
          case 'security':
            recommendations.push('Consider implementing additional security monitoring and incident response procedures')
            break
          case 'performance':
            recommendations.push('Review service performance metrics and consider optimization or scaling')
            break
          case 'reliability':
            recommendations.push('Improve deployment processes and implement better testing procedures')
            break
          case 'cost':
            recommendations.push('Analyze resource usage and consider cost optimization opportunities')
            break
          case 'compliance':
            recommendations.push('Review compliance requirements and implement missing controls')
            break
        }
      }
    }

    return recommendations
  }

  private generatePlatformInsights(healthScores: any, stats: any) {
    const insights: string[] = []

    // Overall health insight
    const overallScore = this.calculateOverallHealthScore(healthScores)
    insights.push(`Platform health score is ${overallScore.toFixed(1)}/100`)

    // Service insights
    insights.push(`Managing ${stats.services} services across ${stats.teams} teams`)

    // Performance insights
    if (healthScores.performance.score < 80) {
      insights.push('Some services may need performance attention')
    }

    // Reliability insights
    if (healthScores.reliability.score < 95) {
      insights.push('Deployment success rate could be improved')
    }

    return insights
  }

  private analyzeIncidentTrends(incidents: any[]) {
    // Group incidents by day
    const incidentsByDay: Record<string, number> = {}
    
    incidents.forEach(incident => {
      const day = new Date(incident.detectedAt).toDateString()
      incidentsByDay[day] = (incidentsByDay[day] || 0) + 1
    })

    const days = Object.keys(incidentsByDay).length
    const totalIncidents = incidents.length
    const avgPerDay = days > 0 ? totalIncidents / days : 0

    return {
      totalIncidents,
      avgPerDay: Math.round(avgPerDay * 100) / 100,
      peakDay: Object.entries(incidentsByDay).reduce((max, [day, count]) => 
        count > max.count ? { day, count } : max, 
        { day: '', count: 0 }
      ),
    }
  }

  private async getServiceCount() {
    return {
      total: await db.service.count(),
      active: await db.service.count({ where: { status: 'ACTIVE' } }),
      deprecated: await db.service.count({ where: { status: 'DEPRECATED' } }),
    }
  }

  private async getActiveIncidentsCount() {
    return {
      total: await db.incident.count({
        where: { status: { in: ['OPEN', 'INVESTIGATING'] } }
      }),
      critical: await db.incident.count({
        where: { 
          status: { in: ['OPEN', 'INVESTIGATING'] },
          severity: 'CRITICAL'
        }
      }),
    }
  }

  private async getRecentDeployments() {
    const deployments = await db.deployment.findMany({
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    return {
      total: deployments.length,
      successful: deployments.filter(d => d.status === 'SUCCESS').length,
      failed: deployments.filter(d => d.status === 'FAILED').length,
      pending: deployments.filter(d => d.status === 'PENDING').length,
    }
  }

  private async getPlatformMetrics() {
    // Mock platform-wide metrics - in reality would aggregate from monitoring systems
    return {
      avgResponseTime: 125, // ms
      errorRate: 0.15, // %
      uptime: 99.95, // %
      throughput: 1250, // req/s
    }
  }

  private async getActiveAlerts() {
    // Mock active alerts - in reality would come from monitoring systems
    return [
      {
        id: 'alert-1',
        severity: 'WARNING',
        message: 'High CPU usage on user-service',
        service: 'user-service',
        triggeredAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: 'alert-2',
        severity: 'CRITICAL',
        message: 'Database connection pool exhausted',
        service: 'database',
        triggeredAt: new Date(Date.now() - 2 * 60 * 1000),
      },
    ]
  }
}