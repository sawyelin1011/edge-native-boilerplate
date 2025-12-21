import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { z } from 'zod'

import { requestContextMiddleware } from './middleware/requestContext'
import { rateLimit } from './middleware/rateLimit'
import { fromZodError, isApiError } from './lib/http/errors'
import { fail } from './lib/http/response'

import { authRoutes } from './routes/auth'
import { v1Routes } from './routes/v1'

import type { AppConfig } from './config'
import type { Database } from './db/client'
import type { AuthUser } from './modules/auth/types'

export type Bindings = {
  DB: D1Database
  KV: KVNamespace
  BUCKET?: R2Bucket

  ENVIRONMENT?: string
  LOG_LEVEL?: string

  CORS_ORIGINS?: string
  CORS_CREDENTIALS?: string

  JWT_SECRET?: string
  JWT_ACCESS_TTL_SECONDS?: string
  JWT_REFRESH_TTL_SECONDS?: string

  SESSION_SECRET?: string
  SESSION_ENABLED?: string
  SESSION_COOKIE_NAME?: string
  SESSION_TTL_SECONDS?: string
  SESSION_ROTATE_EVERY_SECONDS?: string

  RATE_LIMIT_ENABLED?: string
  RATE_LIMIT_WINDOW_SECONDS?: string
  RATE_LIMIT_MAX_REQUESTS?: string

  STORAGE_ENABLED?: string
  STORAGE_SIGNING_SECRET?: string

  DEFAULT_CURRENCY?: string
  DATA_ENCRYPTION_KEY?: string

  DHRU_API_BASE_URL?: string
  DHRU_USERNAME?: string
  DHRU_API_KEY?: string

  NOWPAYMENTS_API_KEY?: string
  NOWPAYMENTS_IPN_SECRET?: string
  NOWPAYMENTS_API_BASE_URL?: string
}

export type Variables = {
  requestId: string
  db: Database
  config: AppConfig
  user?: AuthUser
  csrfToken: string | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', requestContextMiddleware)

app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'no-referrer'
  })
)

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const corsOrigins = c.get('config').cors.origins

      if (corsOrigins === '*') return origin ?? '*'
      if (!origin) return null
      return corsOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
    exposeHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400
  })
)

app.use('/api/*', rateLimit({ prefix: 'api' }))
app.use('/auth/*', rateLimit({ prefix: 'auth' }))

app.get('/health', (c) => {
  const config = c.get('config')
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.environment,
      requestId: c.get('requestId')
    },
    requestId: c.get('requestId')
  })
})

app.route('/api/v1', v1Routes)

// Primary public API base (aliases /api/* to the same versioned routes)
app.route('/api', v1Routes)

// Backwards-compatible aliases
app.route('/auth', authRoutes)

app.notFound((c) => {
  return c.json(
    fail({
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      requestId: c.get('requestId')
    }),
    404
  )
})

app.onError((err, c) => {
  const requestId = c.get('requestId')

  if (err instanceof z.ZodError) {
    const apiError = fromZodError(err)
    return c.json(
      fail({
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
        requestId
      }),
      apiError.status
    )
  }

  if (isApiError(err)) {
    return c.json(
      fail({
        code: err.code,
        message: err.message,
        details: err.details,
        requestId
      }),
      err.status
    )
  }

  console.error('Unhandled error', { requestId, err })

  const message = c.get('config').environment === 'production' ? 'Internal Server Error' : (err as Error).message

  return c.json(
    fail({
      code: 'INTERNAL_ERROR',
      message,
      requestId
    }),
    500
  )
})

export default app
