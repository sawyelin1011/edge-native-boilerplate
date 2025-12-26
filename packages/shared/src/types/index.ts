// GSMFlow Shared Types
// Common types used across all packages

// ============================================================================
// Common Identifiers
// ============================================================================

export type ID = string

export interface Entity {
  readonly id: ID
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  readonly limit?: number
  readonly offset?: number
  readonly cursor?: string
}

export interface PaginatedResult<T> {
  readonly data: ReadonlyArray<T>
  readonly meta: PaginationMeta
}

export interface PaginationMeta {
  readonly total: number
  readonly limit: number
  readonly offset: number
  readonly hasMore: boolean
  readonly nextCursor?: string
}

// ============================================================================
// API Response
// ============================================================================

export interface ApiError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: ApiError
  readonly meta?: ResponseMeta
}

export interface ResponseMeta {
  readonly requestId: string
  readonly timestamp: string
  readonly pagination?: PaginationMeta
}

// ============================================================================
// Date/Time
// ============================================================================

export type DateString = string

export interface DateRange {
  readonly start: DateString
  readonly end: DateString
}

// ============================================================================
// Common Status
// ============================================================================

export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'archived'

export type StatusTransition<T extends Status> = {
  from: T
  to: T
  reason?: string
  timestamp: Date
}

// ============================================================================
// Common Filters
// ============================================================================

export interface DateFilter {
  readonly from?: DateString
  readonly to?: DateString
}

export interface StatusFilter {
  readonly status?: Status | ReadonlyArray<Status>
}

export interface SearchFilter {
  readonly query?: string
  readonly fields?: ReadonlyArray<string>
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>

// ============================================================================
// Environment
// ============================================================================

export type Environment = 'development' | 'staging' | 'production'

export interface RuntimeInfo {
  readonly name: string
  readonly version: string
  readonly environment: Environment
}

// ============================================================================
// Logging
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  readonly level: LogLevel
  readonly message: string
  readonly context?: Record<string, unknown>
  readonly timestamp: Date
  readonly requestId?: string
}

// ============================================================================
// Error Handling
// ============================================================================

export interface ErrorDetails {
  readonly code: string
  readonly message: string
  readonly stack?: string
  readonly context?: Record<string, unknown>
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// ============================================================================
// Export
// ============================================================================

export * from './api'
