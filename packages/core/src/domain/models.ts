// GSMFlow Core Domain Layer
// Pure TypeScript domain models - NO framework imports, NO runtime globals
// Reusable in any runtime environment

// ============================================================================
// Tenant Model
// ============================================================================

export interface Tenant {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly status: TenantStatus
  readonly settings: TenantSettings
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'archived'

export interface TenantSettings {
  readonly features: Record<string, boolean>
  readonly limits: TenantLimits
  readonly branding: TenantBranding
}

export interface TenantLimits {
  readonly maxUsers: number
  readonly maxApiCalls: number
  readonly storageLimit: number
}

export interface TenantBranding {
  readonly primaryColor: string
  readonly logoUrl: string
  readonly domain?: string
}

// ============================================================================
// User Model
// ============================================================================

export interface User {
  readonly id: string
  readonly tenantId: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly status: UserStatus
  readonly permissions: ReadonlyArray<string>
  readonly metadata: UserMetadata
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface UserMetadata {
  readonly avatarUrl?: string
  readonly phone?: string
  readonly lastLoginAt?: Date
  readonly locale?: string
  readonly timezone?: string
}

// ============================================================================
// Role & Permission Models
// ============================================================================

export interface Role {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly description: string
  readonly permissions: ReadonlyArray<string>
  readonly isSystem: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Permission {
  readonly id: string
  readonly resource: string
  readonly action: PermissionAction
  readonly description: string
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'none'

// ============================================================================
// Session Model
// ============================================================================

export interface Session {
  readonly id: string
  readonly tenantId: string
  readonly userId: string
  readonly token: string
  readonly expiresAt: Date
  readonly ipAddress?: string
  readonly userAgent?: string
  readonly createdAt: Date
}

export interface SessionToken {
  readonly token: string
  readonly payload: SessionPayload
}

export interface SessionPayload {
  readonly sessionId: string
  readonly userId: string
  readonly tenantId: string
  readonly roles: ReadonlyArray<string>
  readonly permissions: ReadonlyArray<string>
  readonly exp: number
  readonly iat: number
}

// ============================================================================
// Request Context
// ============================================================================

export interface RequestContext {
  readonly requestId: string
  readonly tenantId: string | null
  readonly userId: string | null
  readonly session: SessionToken | null
  readonly ipAddress?: string
  readonly userAgent?: string
  readonly timestamp: Date
  readonly correlationId?: string
}

// ============================================================================
// API Models
// ============================================================================

export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: ApiError
  readonly meta?: ResponseMeta
}

export interface ApiError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

export interface ResponseMeta {
  readonly requestId: string
  readonly timestamp: string
  readonly pagination?: PaginationInfo
}

export interface PaginationInfo {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly totalPages: number
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly errors?: ReadonlyArray<ValidationError>
}

export interface ValidationError {
  readonly field: string
  readonly message: string
  readonly code: string
}

// ============================================================================
// Result Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// ============================================================================
// Domain Events (for Event Sourcing & CQRS)
// ============================================================================

export interface DomainEvent {
  readonly id: string
  readonly type: string
  readonly tenantId: string
  readonly userId?: string
  readonly aggregateId: string
  readonly aggregateType: string
  readonly payload: Record<string, unknown>
  readonly metadata: EventMetadata
  readonly timestamp: Date
}

export interface EventMetadata {
  readonly correlationId?: string
  readonly causationId?: string
  readonly timestamp: Date
}

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(handler: EventHandler): void
  unsubscribe(handler: EventHandler): void
}

// ============================================================================
// Aggregate Root (Base for Event Sourcing)
// ============================================================================

export interface AggregateRoot {
  readonly id: string
  readonly version: number
  readonly events: ReadonlyArray<DomainEvent>
  apply(event: DomainEvent): void
  getUncommittedEvents(): ReadonlyArray<DomainEvent>
  markEventsCommitted(): void
}

// ============================================================================
// Repository Interface (Persistence Abstraction)
// ============================================================================

export interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(options?: FindOptions): Promise<ReadonlyArray<T>>
  save(entity: T): Promise<void>
  delete(id: string): Promise<void>
  count(options?: FilterOptions): Promise<number>
}

export interface FindOptions {
  readonly limit?: number
  readonly offset?: number
  readonly orderBy?: string
  readonly order?: 'asc' | 'desc'
}

export interface FilterOptions {
  readonly where?: Record<string, unknown>
}

// ============================================================================
// Service Interface (Business Logic)
// ============================================================================

export interface Service<TContext = RequestContext> {
  readonly context: TContext
  execute(input: unknown): Promise<unknown>
}
