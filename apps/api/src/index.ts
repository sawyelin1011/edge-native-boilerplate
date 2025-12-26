// GSMFlow API - Main Entry Point
// Edge-native backend with Hono + tRPC

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

import { apiRoutes } from './routes/api'
import { healthRoutes } from './routes/health'
import { trpcRoutes } from './routes/trpc'

// ============================================================================
// Environment Types
// ============================================================================

export type Bindings = {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  JWT_SECRET?: string
  ENVIRONMENT?: string
  API_VERSION?: string
}

export type Variables = {
  requestId: string
  tenantId: string | null
  userId: string | null
}

// ============================================================================
// App Factory
// ============================================================================

export function createApp(): Hono<{ Bindings: Bindings; Variables: Variables }> {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

  // Global middleware
  app.use('*', logger())
  app.use('*', prettyJSON())
  app.use('*', secureHeaders())

  // CORS - edge-native configuration
  app.use('*', cors({
    origin: (origin, c) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ]
      
      // Allow any localhost in development
      if (c.env.ENVIRONMENT === 'development') {
        return origin
      }
      
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID'],
    exposeHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  }))

  // Request ID and context middleware
  app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID()
    c.set('requestId', requestId)
    c.set('tenantId', c.req.header('X-Tenant-ID') || null)
    c.set('userId', c.req.header('X-User-ID') || null)
    await next()
    c.res.headers.set('X-Request-ID', requestId)
  })

  // Mount routes
  app.route('/health', healthRoutes)
  app.route('/api', apiRoutes)
  app.route('/trpc', trpcRoutes)

  // 404 handler
  app.notFound((c) => {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
      meta: {
        requestId: c.get('requestId'),
        timestamp: new Date().toISOString(),
      },
    }, 404)
  })

  // Global error handler
  app.onError((err, c) => {
    console.error('Error:', err)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: c.env.ENVIRONMENT === 'development' ? err.message : 'Internal server error',
      },
      meta: {
        requestId: c.get('requestId'),
        timestamp: new Date().toISOString(),
      },
    }, 500)
  })

  return app
}

// ============================================================================
// Default export for Cloudflare Workers
// ============================================================================

export default createApp()
