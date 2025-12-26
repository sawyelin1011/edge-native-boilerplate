// GSMFlow Service Contracts
// Service interfaces - framework-independent
// Business logic must be framework-independent

import type {
  RequestContext,
  Result,
  ValidationResult,
  User,
  Tenant,
  Session,
  ApiResponse,
} from '../domain/models'
import type { PolicyDecision, PolicyEngine } from '../policies/interfaces'

// ============================================================================
// Base Service Interfaces
// ============================================================================

export interface BaseService {
  readonly name: string
  execute(input: unknown, context: RequestContext): Promise<unknown>
}

export interface QueryService<I = unknown, O = unknown> {
  execute(input: I, context: RequestContext): Promise<O>
}

export interface CommandService<I = unknown, O = unknown> {
  execute(input: I, context: RequestContext): Promise<O>
}

// ============================================================================
// Tenant Service
// ============================================================================

export interface TenantService {
  findById(id: string): Promise<Tenant | null>
  findBySlug(slug: string): Promise<Tenant | null>
  create(input: CreateTenantInput, context: RequestContext): Promise<Result<Tenant, Error>>
  update(id: string, input: UpdateTenantInput, context: RequestContext): Promise<Result<Tenant, Error>>
  suspend(id: string, context: RequestContext): Promise<Result<void, Error>>
  activate(id: string, context: RequestContext): Promise<Result<void, Error>>
}

export interface CreateTenantInput {
  readonly name: string
  readonly slug: string
  readonly settings?: Partial<Tenant['settings']>
}

export interface UpdateTenantInput {
  readonly name?: string
  readonly settings?: Partial<Tenant['settings']>
  readonly status?: Tenant['status']
}

// ============================================================================
// User Service
// ============================================================================

export interface UserService {
  findById(id: string, context: RequestContext): Promise<User | null>
  findByEmail(email: string, context: RequestContext): Promise<User | null>
  findAll(context: RequestContext, options?: ListUsersOptions): Promise<ReadonlyArray<User>>
  create(input: CreateUserInput, context: RequestContext): Promise<Result<User, Error>>
  update(id: string, input: UpdateUserInput, context: RequestContext): Promise<Result<User, Error>>
  delete(id: string, context: RequestContext): Promise<Result<void, Error>>
  suspend(id: string, context: RequestContext): Promise<Result<void, Error>>
  activate(id: string, context: RequestContext): Promise<Result<void, Error>>
}

export interface ListUsersOptions {
  readonly limit?: number
  readonly offset?: number
  readonly role?: string
  readonly status?: User['status']
}

export interface CreateUserInput {
  readonly email: string
  readonly name: string
  readonly role?: string
  readonly metadata?: Partial<User['metadata']>
}

export interface UpdateUserInput {
  readonly name?: string
  readonly role?: string
  readonly metadata?: Partial<User['metadata']>
  readonly status?: User['status']
}

// ============================================================================
// Authentication Service
// ============================================================================

export interface AuthService {
  login(input: LoginInput, context: RequestContext): Promise<Result<AuthResult, Error>>
  register(input: RegisterInput, context: RequestContext): Promise<Result<AuthResult, Error>>
  logout(sessionId: string, context: RequestContext): Promise<Result<void, Error>>
  refreshToken(refreshToken: string, context: RequestContext): Promise<Result<AuthResult, Error>>
  validateSession(token: string, context: RequestContext): Promise<Session | null>
  getCurrentUser(context: RequestContext): Promise<User | null>
}

export interface LoginInput {
  readonly email: string
  readonly password: string
}

export interface RegisterInput {
  readonly email: string
  readonly password: string
  readonly name: string
  readonly tenantSlug?: string
}

export interface AuthResult {
  readonly user: User
  readonly session: Session
  readonly accessToken: string
  readonly refreshToken: string
}

// ============================================================================
// Session Service
// ============================================================================

export interface SessionService {
  create(userId: string, tenantId: string, context: RequestContext): Promise<Session>
  validate(token: string): Promise<Session | null>
  invalidate(sessionId: string): Promise<void>
  invalidateAll(userId: string): Promise<void>
  getActiveSessions(userId: string): Promise<ReadonlyArray<Session>>
  cleanupExpired(): Promise<number>
}

// ============================================================================
// Health Service
// ============================================================================

export interface HealthService {
  check(context: RequestContext): Promise<HealthCheckResult>
  checkDependency(name: string, context: RequestContext): Promise<HealthCheckResult>
}

export interface HealthCheckResult {
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly timestamp: string
  readonly version: string
  readonly dependencies: ReadonlyArray<{ name: string; status: 'healthy' | 'degraded' | 'unhealthy'; latency?: number }>
  readonly metadata?: Record<string, unknown>
}

// ============================================================================
// Event Service
// ============================================================================

export interface EventService {
  publish(event: unknown): Promise<void>
  subscribe(handler: ServiceEventHandler): void
  unsubscribe(handler: ServiceEventHandler): void
}

export interface ServiceEventHandler {
  handle(event: unknown): Promise<void>
}

// ============================================================================
// Validation Service
// ============================================================================

export interface ValidationService {
  validate<T>(data: unknown, schema: ValidationSchema): ValidationResult<T>
  createSchema(name: string, schema: ValidationSchema): void
  getSchema(name: string): ValidationSchema | null
}

export interface ValidationSchema {
  validate(data: unknown): ValidationResult<unknown>
  parse(data: unknown): unknown
}

// ============================================================================
// Policy Service
// ============================================================================

export interface PolicyService {
  readonly engine: PolicyEngine
  
  can(action: string, resource: string, context: RequestContext): Promise<PolicyDecision>
  canAll(requirements: Array<{ action: string; resource: string }>, context: RequestContext): Promise<PolicyDecision>
  canAny(requirements: Array<{ action: string; resource: string }>, context: RequestContext): Promise<PolicyDecision>
}

// ============================================================================
// Service Factory (for dependency injection)
// ============================================================================

export interface ServiceFactory {
  getTenantService(): TenantService
  getUserService(): UserService
  getAuthService(): AuthService
  getSessionService(): SessionService
  getHealthService(): HealthService
  getEventService(): EventService
  getValidationService(): ValidationService
  getPolicyService(): PolicyService
}

// ============================================================================
// Service Context
// ============================================================================

export interface ServiceContext {
  readonly requestContext: RequestContext
  readonly services: ServiceFactory
  readonly policy: PolicyService
}
