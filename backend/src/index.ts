import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

import { apiRoutes } from './routes/api'
import { authRoutes } from './routes/auth'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './lib/schema'

// Edge-native types (following Edge Manifest pattern)
export type Bindings = {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  JWT_SECRET?: string
  SESSION_SECRET?: string
  DATABASE_ID?: string
  ENVIRONMENT?: string
  EXTERNAL_API_KEY?: string
  WEBHOOK_SECRET?: string
}

export type Variables = {
  requestId: string
  db: ReturnType<typeof drizzle>
  user?: {
    id: string
    email: string
    role: string
  }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())

// CORS middleware - edge-native configuration
app.use('*', cors({
  origin: (origin, c) => {
    // In development, allow localhost and 127.0.0.1
    // In production, configure specific origins
    if (!origin) return '*'
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://yourdomain.com'
    ]
    
    return allowedOrigins.includes(origin) ? origin : null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400
}))

// Request ID and database middleware
app.use('*', async (c, next) => {
  // Generate request ID using Web Crypto API (edge-native)
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  
  // Initialize Drizzle database
  c.set('db', drizzle(c.env.DB, { schema }))
  
  await next()
  
  // Add request ID to response headers
  c.res.headers.set('X-Request-ID', requestId)
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown',
    requestId: c.get('requestId')
  })
})

// API routes with optional authentication
app.route('/api', apiRoutes)
app.route('/auth', authRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    requestId: c.get('requestId')
  }, 404)
})

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err)
  
  return c.json({
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'Something went wrong',
    requestId: c.get('requestId')
  }, 500)
})

export default app