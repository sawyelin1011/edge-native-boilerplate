// GSMFlow tRPC Routers
// Router definitions for typed API endpoints

import type { RequestContext } from '@gsmflow/core'
import type { ProcedureContext } from '../procedures/types'
import { healthRouter } from './health'
import { authRouter } from './auth'
import { userRouter } from './user'
import { tenantRouter } from './tenant'
import { walletRouter } from './wallet'
import { orderRouter } from './order'
import { pricingRouter } from './pricing'

// ============================================================================
// Router Types
// ============================================================================

export interface TRPCRouter {
  readonly name: string
  readonly routes: TRPCRouteMap
}

export interface TRPCRouteMap {
  [key: string]: TRPCRoute
}

export type TRPCRoute = TRPCQueryRoute | TRPCMutationRoute

export interface TRPCQueryRoute {
  readonly type: 'query'
  readonly input?: unknown
  readonly output?: unknown
  readonly handler: (ctx: TRPCRouteContext) => Promise<unknown>
}

export interface TRPCMutationRoute {
  readonly type: 'mutation'
  readonly input?: unknown
  readonly output?: unknown
  readonly handler: (ctx: TRPCRouteContext) => Promise<unknown>
}

export interface TRPCRouteContext {
  readonly ctx: ProcedureContext
  readonly input: unknown
}

// ============================================================================
// Health Router
// ============================================================================

export const healthRouter: TRPCRouter = {
  name: 'health',
  routes: {
    check: {
      type: 'query',
      handler: async (ctx) => {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        }
      },
    },
    ping: {
      type: 'query',
      handler: async () => {
        return { pong: true, timestamp: new Date().toISOString() }
      },
    },
  },
}

// ============================================================================
// Auth Router (Foundation Only)
// ============================================================================

export const authRouter: TRPCRouter = {
  name: 'auth',
  routes: {
    register: {
      type: 'mutation',
      input: {
        email: 'string',
        password: 'string',
        name: 'string',
        tenantSlug: 'string?',
      },
      handler: async (ctx) => {
        // Placeholder - Phase 2 implementation
        return {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Auth registration not implemented in Phase 1',
          },
        }
      },
    },
    login: {
      type: 'mutation',
      input: {
        email: 'string',
        password: 'string',
      },
      handler: async (ctx) => {
        // Placeholder - Phase 2 implementation
        return {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Auth login not implemented in Phase 1',
          },
        }
      },
    },
    me: {
      type: 'query',
      handler: async (ctx) => {
        // Placeholder - Phase 2 implementation
        return {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Auth me not implemented in Phase 1',
          },
        }
      },
    },
    logout: {
      type: 'mutation',
      handler: async (ctx) => {
        return { success: true }
      },
    },
  },
}

// ============================================================================
// Tenant Router (Foundation Only)
// ============================================================================

export const tenantRouter: TRPCRouter = {
  name: 'tenant',
  routes: {
    create: {
      type: 'mutation',
      input: {
        name: 'string',
        slug: 'string',
        settings: 'object?',
        metadata: 'object?',
      },
      handler: async (ctx) => {
        return {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Tenant create not implemented in Phase 1',
          },
        }
      },
    },
    get: {
      type: 'query',
      input: {
        id: 'string?',
        slug: 'string?',
      },
      handler: async (ctx) => {
        return {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Tenant get not implemented in Phase 1',
          },
        }
      },
    },
    list: {
      type: 'query',
      input: {
        limit: 'number?',
        offset: 'number?',
        status: 'string?',
        search: 'string?',
      },
      handler: async (ctx) => {
        return { data: [], meta: { total: 0, requestId: ctx.ctx.requestContext?.requestId || 'unknown' } }
      },
    },
    update: {
      type: 'mutation',
      input: {
        id: 'string',
        name: 'string?',
        status: 'string?',
      },
      handler: async (ctx) => {
        return {
          success: false,
          error: { code: 'NOT_IMPLEMENTED', message: 'Tenant update not implemented' },
        }
      },
    },
    delete: {
      type: 'mutation',
      input: { id: 'string' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Tenant delete not implemented' } }
      },
    },
    suspend: {
      type: 'mutation',
      input: { id: 'string', reason: 'string?' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Tenant suspend not implemented' } }
      },
    },
    activate: {
      type: 'mutation',
      input: { id: 'string' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Tenant activate not implemented' } }
      },
    },
    updateSettings: {
      type: 'mutation',
      input: { id: 'string', settings: 'object' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Tenant settings not implemented' } }
      },
    },
  },
}

// ============================================================================
// User Router (Foundation Only)
// ============================================================================

export const userRouter: TRPCRouter = {
  name: 'user',
  routes: {
    get: {
      type: 'query',
      input: { id: 'string?' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'User get not implemented' } }
      },
    },
    list: {
      type: 'query',
      input: { limit: 'number?', offset: 'number?', role: 'string?', status: 'string?' },
      handler: async (ctx) => {
        return { data: [], meta: { total: 0 } }
      },
    },
    create: {
      type: 'mutation',
      input: { email: 'string', name: 'string', role: 'string?', tenantId: 'string?' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'User create not implemented' } }
      },
    },
    update: {
      type: 'mutation',
      input: { id: 'string', name: 'string?', role: 'string?', status: 'string?' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'User update not implemented' } }
      },
    },
    delete: {
      type: 'mutation',
      input: { id: 'string' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'User delete not implemented' } }
      },
    },
    suspend: {
      type: 'mutation',
      input: { id: 'string', reason: 'string?' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'User suspend not implemented' } }
      },
    },
    activate: {
      type: 'mutation',
      input: { id: 'string' },
      handler: async (ctx) => {
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'User activate not implemented' } }
      },
    },
  },
}

// ============================================================================
// Root Router (App Router)
// ============================================================================

export const appRouter: TRPCRouter = {
  name: 'app',
  routes: {
    // Health
    'health.check': healthRouter.routes.check,
    'health.ping': healthRouter.routes.ping,
    
    // Auth
    'auth.register': authRouter.routes.register,
    'auth.login': authRouter.routes.login,
    'auth.me': authRouter.routes.me,
    'auth.logout': authRouter.routes.logout,
    
    // Tenant
    'tenant.create': tenantRouter.routes.create,
    'tenant.get': tenantRouter.routes.get,
    'tenant.list': tenantRouter.routes.list,
    'tenant.update': tenantRouter.routes.update,
    'tenant.delete': tenantRouter.routes.delete,
    'tenant.suspend': tenantRouter.routes.suspend,
    'tenant.activate': tenantRouter.routes.activate,
    'tenant.updateSettings': tenantRouter.routes.updateSettings,
    
    // User
    'user.get': userRouter.routes.get,
    'user.list': userRouter.routes.list,
    'user.create': userRouter.routes.create,
    'user.update': userRouter.routes.update,
    'user.delete': userRouter.routes.delete,
    
    // Wallet
    'wallet.get': walletRouter.routes.get,
    'wallet.getByRole': walletRouter.routes.getByRole,
    'wallet.list': walletRouter.routes.list,
    'wallet.credit': walletRouter.routes.credit,
    'wallet.debit': walletRouter.routes.debit,
    'wallet.lock': walletRouter.routes.lock,
    'wallet.unlock': walletRouter.routes.unlock,
    'wallet.refund': walletRouter.routes.refund,
    'wallet.history': walletRouter.routes.history,
    'wallet.summary': walletRouter.routes.summary,
    'wallet.transfer': walletRouter.routes.transfer,
    
    // Order
    'order.create': orderRouter.routes.create,
    'order.get': orderRouter.routes.get,
    'order.getByNumber': orderRouter.routes.getByNumber,
    'order.list': orderRouter.routes.list,
    'order.myOrders': orderRouter.routes.myOrders,
    'order.cancel': orderRouter.routes.cancel,
    'order.refund': orderRouter.routes.refund,
    'order.statistics': orderRouter.routes.statistics,
    'order.timeline': orderRouter.routes.timeline,
    'order.retry': orderRouter.routes.retry,
    
    // Pricing
    'pricing.setBasePrice': pricingRouter.routes.setBasePrice,
    'pricing.getBasePrice': pricingRouter.routes.getBasePrice,
    'pricing.setMarkup': pricingRouter.routes.setMarkup,
    'pricing.getMarkup': pricingRouter.routes.getMarkup,
    'pricing.getMarkups': pricingRouter.routes.getMarkups,
    'pricing.deleteMarkup': pricingRouter.routes.deleteMarkup,
    'pricing.calculate': pricingRouter.routes.calculate,
    'pricing.breakdown': pricingRouter.routes.breakdown,
    'pricing.profit': pricingRouter.routes.profit,
    'pricing.history': pricingRouter.routes.history,
    'pricing.syncProvider': pricingRouter.routes.syncProvider,
  },
}

// ============================================================================
// Router Utilities
// ============================================================================

export function createRouter(routers: ReadonlyArray<TRPCRouter>): TRPCRouter {
  const routeMap: TRPCRouteMap = {}
  
  for (const router of routers) {
    for (const [key, route] of Object.entries(router.routes)) {
      if (key === router.name) {
        // Nested router
        routeMap[key] = route
      } else {
        // Prefixed route
        routeMap[`${router.name}.${key}`] = route
      }
    }
  }
  
  return {
    name: 'root',
    routes: routeMap,
  }
}

export function mergeRouters(base: TRPCRouter, ...additional: ReadonlyArray<TRPCRouter>): TRPCRouter {
  const routes = { ...base.routes }
  
  for (const router of additional) {
    for (const [key, route] of Object.entries(router.routes)) {
      routes[`${router.name}.${key}`] = route
    }
  }
  
  return {
    ...base,
    routes,
  }
}
