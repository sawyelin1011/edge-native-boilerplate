// Health Check Routes

import { Hono } from 'hono'
import type { Bindings, Variables } from '../index'

export const healthRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Basic health check
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: c.env.API_VERSION || '1.0.0',
    environment: c.env.ENVIRONMENT || 'unknown',
    runtime: 'cloudflare',
  })
})

// Liveness probe (basic)
healthRoutes.get('/live', (c) => {
  return c.json({ status: 'alive' })
})

// Readiness probe (with dependencies)
healthRoutes.get('/ready', async (c) => {
  try {
    // Check database connection
    await c.env.DB.prepare('SELECT 1').run()
    
    return c.json({
      status: 'ready',
      dependencies: {
        database: 'healthy',
      },
    })
  } catch (error) {
    return c.json({
      status: 'not_ready',
      dependencies: {
        database: 'unhealthy',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 503)
  }
})

// Detailed health check
healthRoutes.get('/detailed', async (c) => {
  const startTime = Date.now()
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}
  
  // Check database
  try {
    const dbStart = Date.now()
    await c.env.DB.prepare('SELECT 1').run()
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  return c.json({
    status: Object.values(checks).every(c => c.status === 'healthy') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: c.env.API_VERSION || '1.0.0',
    uptime: process.uptime?.() || 0,
    checks,
    meta: {
      requestId: c.get('requestId'),
      totalLatency: Date.now() - startTime,
    },
  })
})
