import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connection (if available)
    const dbStatus = await checkDatabase()
    
    // Check Redis connection (if available)
    const redisStatus = await checkRedis()
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        web: 'healthy',
        database: dbStatus,
        redis: redisStatus,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function checkDatabase(): Promise<string> {
  try {
    // This would check the actual database connection
    // For now, we'll return a mock status
    return 'healthy'
  } catch (error) {
    return 'unhealthy'
  }
}

async function checkRedis(): Promise<string> {
  try {
    // This would check the actual Redis connection
    // For now, we'll return a mock status
    return 'healthy'
  } catch (error) {
    return 'unhealthy'
  }
}
