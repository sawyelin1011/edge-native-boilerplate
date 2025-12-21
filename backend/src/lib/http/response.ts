import type { ApiErrorResponse, ApiSuccessResponse } from 'shared'
import type { ErrorCode } from './errors'

export function ok<T>(params: { data: T; requestId?: string; meta?: Record<string, unknown> }): ApiSuccessResponse<T> {
  return {
    success: true,
    data: params.data,
    meta: params.meta,
    requestId: params.requestId
  }
}

export function fail(params: {
  code: ErrorCode
  message: string
  requestId?: string
  details?: unknown
}): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      details: params.details
    },
    requestId: params.requestId
  }
}
