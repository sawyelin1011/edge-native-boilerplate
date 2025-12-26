// GSMFlow tRPC Procedures
// Typed API procedures with permission checking

import type { RequestContext, ApiResponse } from '@gsmflow/core'

// ============================================================================
// Procedure Types
// ============================================================================

export type ProcedureType = 'query' | 'mutation' | 'subscription'

export interface ProcedureOptions<TInput = unknown, TOutput = unknown> {
  readonly type: ProcedureType
  readonly input?: ProcedureInput<TInput>
  readonly output?: ProcedureOutput<TOutput>
  readonly permissions?: ReadonlyArray<PermissionRequirement>
  readonly middlewares?: ReadonlyArray<ProcedureMiddleware>
}

export interface ProcedureInput<T> {
  validate(data: unknown): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> }
  parse(data: unknown): T
}

export interface ProcedureOutput<T> {
  validate(data: unknown): { success: true; data: T } | { success: false; error: string }
}

export interface PermissionRequirement {
  readonly action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  readonly resource: string
}

// ============================================================================
// Middleware Types
// ============================================================================

export interface ProcedureMiddleware {
  (ctx: ProcedureContext, next: () => Promise<unknown>): Promise<unknown>
}

export interface ProcedureContext {
  readonly requestContext: RequestContext
  readonly input: unknown
  readonly output: unknown
  readonly path: string
  readonly type: ProcedureType
}

// ============================================================================
// Built-in Middlewares
// ============================================================================

export const authMiddleware: ProcedureMiddleware = async (ctx, next) => {
  if (!ctx.requestContext.userId) {
    throw new Error('Unauthorized: Authentication required')
  }
  await next()
}

export const tenantMiddleware: ProcedureMiddleware = async (ctx, next) => {
  if (!ctx.requestContext.tenantId) {
    throw new Error('Forbidden: Tenant context required')
  }
  await next()
}

export const permissionMiddleware: ProcedureMiddleware = async (_ctx, next) => {
  // Permission checking will be implemented in Phase 2
  await next()
}

// ============================================================================
// Error Types
// ============================================================================

export interface TRPCError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

// ============================================================================
// Context Factory
// ============================================================================

export interface TRPCContextFactory {
  create(request: { headers: Record<string, string> }): ProcedureContext
}

// ============================================================================
// Response Helpers
// ============================================================================

export function createSuccessResponse<T>(data: T, meta?: { requestId: string; pagination?: unknown }): ApiResponse<T> {
  const requestId = meta?.requestId || 'unknown'
  return {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...(meta?.pagination && { pagination: meta.pagination }),
    },
  }
}

export function createErrorResponse(error: TRPCError): ApiResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  }
}
