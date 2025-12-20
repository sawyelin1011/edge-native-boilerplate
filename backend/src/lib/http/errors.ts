import { z } from 'zod'

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(params: { status: number; code: ErrorCode; message: string; details?: unknown }) {
    super(params.message)
    this.status = params.status
    this.code = params.code
    this.details = params.details
  }
}

export function fromZodError(error: z.ZodError): ApiError {
  return new ApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: error.flatten()
  })
}
