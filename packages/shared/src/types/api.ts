// GSMFlow API Types
// Shared API request/response types

import type { PaginationParams, ApiResponse, ApiError } from './index'

// ============================================================================
// Request Types
// ============================================================================

export interface ApiRequest<T = unknown> {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  readonly path: string
  readonly body?: T
  readonly query?: Record<string, string>
  readonly headers?: Record<string, string>
}

// ============================================================================
// Health Types
// ============================================================================

export interface HealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly timestamp: string
  readonly version: string
  readonly environment: string
  readonly runtime: string
  readonly dependencies?: Record<string, HealthCheckResult>
}

export interface HealthCheckResult {
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly latency?: number
  readonly error?: string
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  readonly email: string
  readonly password: string
}

export interface RegisterRequest {
  readonly email: string
  readonly password: string
  readonly name: string
  readonly tenantSlug?: string
}

export interface AuthResponse {
  readonly user: UserResponse
  readonly token: string
  readonly refreshToken?: string
}

export interface UserResponse {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly status: string
}

// ============================================================================
// Tenant Types
// ============================================================================

export interface TenantRequest {
  readonly name: string
  readonly slug: string
  readonly settings?: TenantSettings
}

export interface TenantSettings {
  readonly features?: Record<string, boolean>
  readonly limits?: TenantLimits
}

export interface TenantLimits {
  readonly maxUsers: number
  readonly maxApiCalls: number
  readonly storageLimit: number
}

export interface TenantResponse {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly status: string
  readonly settings: TenantSettings
  readonly createdAt: string
  readonly updatedAt: string
}

// ============================================================================
// User Types
// ============================================================================

export interface UserRequest {
  readonly email: string
  readonly name: string
  readonly role?: string
}

export interface UserListRequest extends PaginationParams {
  readonly role?: string
  readonly status?: string
}

export interface UserListResponse extends ApiResponse<ReadonlyArray<UserResponse>> {
  meta: {
    requestId: string
    timestamp: string
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

// ============================================================================
// Common API Responses
// ============================================================================

export type EmptyResponse = ApiResponse<null>

export type HealthResponse = ApiResponse<HealthStatus>

export type LoginResponse = ApiResponse<AuthResponse>

export type RegisterResponse = ApiResponse<AuthResponse>

export type TenantListResponse = ApiResponse<ReadonlyArray<TenantResponse>>
