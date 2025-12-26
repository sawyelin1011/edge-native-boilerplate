// tRPC Routes (Typed API endpoints)

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, Variables } from '../index'
import { appRouter, healthRouter } from '@gsmflow/trpc-contracts'
import type { TRPCRouteContext } from '@gsmflow/trpc-contracts'

export const trpcRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply CORS to tRPC routes
trpcRoutes.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}))

// tRPC request handler
trpcRoutes.all('/:path{.*}', async (c) => {
  const path = c.req.param('path') || ''
  const method = c.req.method
  
  // Parse query params
  const query = Object.fromEntries(new URL(c.req.url).searchParams)
  
  // Parse body
  let body: unknown = null
  if (method === 'POST') {
    try {
      body = await c.req.json()
    } catch {
      body = null
    }
  }

  // Build request context
  const requestContext = {
    requestId: c.get('requestId') || crypto.randomUUID(),
    tenantId: c.get('tenantId') || c.req.header('X-Tenant-ID') || null,
    userId: c.get('userId') || c.req.header('X-User-ID') || null,
    session: null,
    ipAddress: c.req.header('CF-Connecting-IP') || undefined,
    userAgent: c.req.header('User-Agent') || undefined,
    timestamp: new Date(),
  }

  // Route to handler
  const result = await handleTRPCRequest(
    appRouter,
    path,
    method,
    { body, query },
    requestContext
  )

  // Return response
  if (result.status >= 400) {
    return c.json(result, result.status)
  }
  
  return c.json(result.body, result.status)
})

// Health check via tRPC
trpcRoutes.get('/health', async (c) => {
  const requestContext = {
    requestId: c.get('requestId') || crypto.randomUUID(),
    tenantId: null,
    userId: null,
    session: null,
    timestamp: new Date(),
  }

  const result = await handleTRPCRequest(
    healthRouter,
    'check',
    'GET',
    { body: null, query: {} },
    requestContext
  )

  return c.json(result.body, result.status)
})

// ============================================================================
// tRPC Request Handler
// ============================================================================

interface TRPCRequest {
  body: unknown
  query: Record<string, string>
}

interface TRPCResponse {
  status: number
  body: unknown
}

interface TRPCRouter {
  name: string
  routes: Record<string, {
    type: 'query' | 'mutation'
    handler: (ctx: TRPCRouteContext) => Promise<unknown>
  }>
}

async function handleTRPCRequest(
  router: TRPCRouter,
  path: string,
  method: string,
  request: TRPCRequest,
  context: Record<string, unknown>
): Promise<TRPCResponse> {
  // Parse path (format: router.method or router.nested.method)
  const parts = path.split('.')
  const routeKey = parts.pop()
  const routerName = parts.join('.')

  // Find route
  const route = router.routes[path] || router.routes[`${routerName}.${routeKey}`]
  
  if (!route) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `tRPC route not found: ${path}`,
        },
      },
    }
  }

  // Build route context
  const routeContext: TRPCRouteContext = {
    ctx: {
      requestContext: context as any,
      input: request.body || request.query,
      output: null,
      path,
      type: route.type,
    },
    input: request.body || request.query,
  }

  try {
    const result = await route.handler(routeContext)
    
    return {
      status: route.type === 'mutation' ? 200 : 200,
      body: {
        success: true,
        data: result,
        meta: {
          requestId: context.requestId,
          timestamp: new Date().toISOString(),
        },
      },
    }
  } catch (error) {
    console.error('tRPC error:', error)
    
    return {
      status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    }
  }
}
