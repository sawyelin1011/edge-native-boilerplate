// ============================================================================
// Tenant Service Interface
// Multi-tenant operations with strict isolation
// ============================================================================

import type { RequestContext } from '../models'
import type { Tenant, TenantStatus, TenantSettings, TenantMetadata } from './tenant'

// ============================================================================
// Service Interface
// ============================================================================

export interface TenantService {
  // CRUD Operations
  create(input: CreateTenantInput, context: RequestContext): Promise<Result<Tenant, TenantError>>
  getById(id: string, context: RequestContext): Promise<Result<Tenant | null, TenantError>>
  getBySlug(slug: string, context: RequestContext): Promise<Result<Tenant | null, TenantError>>
  update(id: string, input: UpdateTenantInput, context: RequestContext): Promise<Result<Tenant, TenantError>>
  delete(id: string, context: RequestContext): Promise<Result<void, TenantError>>
  
  // Status Management
  suspend(id: string, reason: string, context: RequestContext): Promise<Result<void, TenantError>>
  activate(id: string, context: RequestContext): Promise<Result<void, TenantError>>
  archive(id: string, context: RequestContext): Promise<Result<void, TenantError>>
  
  // Listing & Querying
  list(options: ListTenantsOptions, context: RequestContext): Promise<Result<ListTenantsResult, TenantError>>
  count(options: CountTenantsOptions, context: RequestContext): Promise<Result<number, TenantError>>
  
  // Settings Management
  updateSettings(id: string, settings: Partial<TenantSettings>, context: RequestContext): Promise<Result<Tenant, TenantError>>
  updateMetadata(id: string, metadata: Partial<TenantMetadata>, context: RequestContext): Promise<Result<Tenant, TenantError>>
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateTenantInput {
  readonly name: string
  readonly slug: string
  readonly settings?: Partial<TenantSettings>
  readonly metadata?: Partial<TenantMetadata>
}

export interface UpdateTenantInput {
  readonly name?: string
  readonly status?: TenantStatus
}

export interface ListTenantsOptions {
  readonly limit?: number
  readonly offset?: number
  readonly status?: TenantStatus | ReadonlyArray<TenantStatus>
  readonly search?: string
  readonly sortBy?: 'name' | 'createdAt' | 'status'
  readonly sortOrder?: 'asc' | 'desc'
}

export interface CountTenantsOptions {
  readonly status?: TenantStatus | ReadonlyArray<TenantStatus>
}

export interface ListTenantsResult {
  readonly tenants: ReadonlyArray<Tenant>
  readonly total: number
  readonly hasMore: boolean
  readonly nextOffset?: number
}

// ============================================================================
// Result Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

export type TenantErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_INPUT'
  | 'PERMISSION_DENIED'
  | 'TENANT_SUSPENDED'
  | 'TENANT_ARCHIVED'
  | 'SLUG_INVALID'
  | 'SLUG_IN_USE'

export class TenantError extends Error {
  readonly code: TenantErrorCode
  readonly tenantId?: string
  readonly details?: Record<string, unknown>

  constructor(code: TenantErrorCode, message: string, tenantId?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'TenantError'
    this.code = code
    this.tenantId = tenantId
    this.details = details
  }
}

// ============================================================================
// Factory (for dependency injection)
// ============================================================================

export interface TenantServiceFactory {
  create(context: RequestContext): TenantService
}

// ============================================================================
// Default Implementation Stub
// ============================================================================

export const tenantService: TenantService = {
  async create(input, _context) {
    // Phase 2 implementation required
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async getById(_id, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async getBySlug(_slug, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async update(_id, _input, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async delete(_id, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async suspend(_id, _reason, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async activate(_id, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async archive(_id, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async list(_options, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async count(_options, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async updateSettings(_id, _settings, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
  async updateMetadata(_id, _metadata, _context) {
    return { success: false, error: new TenantError('NOT_FOUND', 'Tenant service not implemented') }
  },
}
