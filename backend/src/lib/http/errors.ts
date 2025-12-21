import { z } from 'zod'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export type ApiError = Error & {
  name: 'ApiError'
  status: ContentfulStatusCode
  code: ErrorCode
  details?: unknown
}

export function createApiError(params: {
  status: ContentfulStatusCode
  code: ErrorCode
  message: string
  details?: unknown
}): ApiError {
  const err = new Error(params.message) as ApiError
  err.name = 'ApiError'
  err.status = params.status
  err.code = params.code
  err.details = params.details
  return err
}

export function isApiError(error: unknown): error is ApiError {
  if (!(error instanceof Error)) return false
  const maybe = error as Partial<ApiError>
  return maybe.name === 'ApiError' && typeof maybe.status === 'number' && typeof maybe.code === 'string'
}

export function fromZodError(error: z.ZodError): ApiError {
  return createApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: error.flatten()
  })
}
