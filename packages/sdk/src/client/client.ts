// GSMFlow SDK
// Client-side SDK for frontend and external consumers

import type { RequestContext } from '@gsmflow/core'

// ============================================================================
// Client Configuration
// ============================================================================

export interface ClientConfig {
  readonly baseUrl: string
  readonly apiKey?: string
  readonly tenantId?: string
  readonly timeout?: number
  readonly fetch?: typeof fetch
}

export interface ClientOptions extends Partial<ClientConfig> {
  readonly apiKey?: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ApiRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  body?: T
  query?: Record<string, string>
  headers?: Record<string, string>
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    requestId: string
    timestamp: string
  }
}

// ============================================================================
// Client Class
// ============================================================================

export class GsmFlowClient {
  private config: Required<ClientConfig>

  constructor(options: ClientOptions = {}) {
    this.config = {
      baseUrl: options.baseUrl || '',
      apiKey: options.apiKey || '',
      tenantId: options.tenantId || '',
      timeout: options.timeout || 30000,
      fetch: options.fetch || fetch,
    }
  }

  // Health check
  async health(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request('GET', '/health')
  }

  // Auth operations
  async login(email: string, password: string): Promise<ApiResponse<{ user: unknown; token: string }>> {
    return this.request('POST', '/auth/login', { email, password })
  }

  async register(data: { email: string; password: string; name: string }): Promise<ApiResponse<{ user: unknown; token: string }>> {
    return this.request('POST', '/auth/register', data)
  }

  async getMe(): Promise<ApiResponse<{ user: unknown }>> {
    return this.request('GET', '/auth/me')
  }

  async logout(): Promise<ApiResponse> {
    return this.request('POST', '/auth/logout')
  }

  // Tenant operations
  async getTenant(id?: string): Promise<ApiResponse<unknown>> {
    return this.request('GET', id ? `/tenant?id=${id}` : '/tenant')
  }

  async listTenants(options?: { limit?: number; offset?: number }): Promise<ApiResponse<{ data: unknown[] }>> {
    const query = new URLSearchParams()
    if (options?.limit) query.set('limit', String(options.limit))
    if (options?.offset) query.set('offset', String(options.offset))
    return this.request('GET', `/tenant/list?${query}`)
  }

  // User operations
  async getUser(id?: string): Promise<ApiResponse<unknown>> {
    return this.request('GET', id ? `/user?id=${id}` : '/user')
  }

  async listUsers(options?: { limit?: number; offset?: number }): Promise<ApiResponse<{ data: unknown[] }>> {
    const query = new URLSearchParams()
    if (options?.limit) query.set('limit', String(options.limit))
    if (options?.offset) query.set('offset', String(options.offset))
    return this.request('GET', `/user/list?${query}`)
  }

  // Generic request method
  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: unknown,
    query?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, query)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }
    
    if (this.config.tenantId) {
      headers['X-Tenant-ID'] = this.config.tenantId
    }

    try {
      const response = await this.config.fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json() as ApiResponse<T>
      return data
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.config.baseUrl)
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    return url.toString()
  }

  // Set tenant context
  setTenant(tenantId: string): void {
    this.config.tenantId = tenantId
  }

  // Set auth token
  setToken(token: string): void {
    this.config.apiKey = token
  }

  // Clear auth
  clearAuth(): void {
    this.config.apiKey = ''
    this.config.tenantId = ''
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createClient(options: ClientOptions = {}): GsmFlowClient {
  return new GsmFlowClient(options)
}

// ============================================================================
// React Query / SWR hooks placeholder (Phase 2)
// ============================================================================

export function createHooks(_client: GsmFlowClient) {
  return {
    useHealth: () => ({ data: null, isLoading: true, error: null }),
    useLogin: () => ({ mutate: async () => {}, isLoading: false }),
    useRegister: () => ({ mutate: async () => {}, isLoading: false }),
    useMe: () => ({ data: null, isLoading: true, error: null }),
    useTenant: () => ({ data: null, isLoading: true, error: null }),
    useUsers: () => ({ data: null, isLoading: true, error: null }),
  }
}
