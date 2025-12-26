// GSMFlow Policy Interfaces
// Role & Permission system - foundation only, empty implementation

import type { PermissionAction, RequestContext } from '../domain/models'

// ============================================================================
// Policy Engine Interfaces
// ============================================================================

export interface PolicyEngine {
  can(action: PermissionAction, resource: string, context: RequestContext): Promise<PolicyDecision>
  canAll(requirements: Array<{ action: PermissionAction; resource: string }>, context: RequestContext): Promise<PolicyDecision>
  canAny(requirements: Array<{ action: PermissionAction; resource: string }>, context: RequestContext): Promise<PolicyDecision>
}

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: PolicyDeniedReason }

export interface PolicyDeniedReason {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

// ============================================================================
// Permission Policy Interfaces
// ============================================================================

export interface PermissionPolicy {
  readonly name: string
  readonly description: string
  evaluate(action: PermissionAction, resource: string, context: RequestContext): Promise<PolicyDecision>
}

// ============================================================================
// Role Policy Interfaces
// ============================================================================

export interface RolePolicy {
  readonly id: string
  readonly name: string
  readonly permissions: ReadonlyArray<string>
  hasPermission(permission: string): boolean
  hasAnyPermission(permissions: ReadonlyArray<string>): boolean
  hasAllPermissions(permissions: ReadonlyArray<string>): boolean
}

// ============================================================================
// Resource Policy Interfaces
// ============================================================================

export interface ResourcePolicy<R = unknown> {
  readonly resourceType: string
  canCreate(context: RequestContext, resource: R): Promise<PolicyDecision>
  canRead(context: RequestContext, resourceId: string): Promise<PolicyDecision>
  canUpdate(context: RequestContext, resource: R): Promise<PolicyDecision>
  canDelete(context: RequestContext, resourceId: string): Promise<PolicyDecision>
  canManage(context: RequestContext, resourceId: string): Promise<PolicyDecision>
}

// ============================================================================
// Tenant Policy Interfaces
// ============================================================================

export interface TenantPolicy {
  readonly tenantId: string
  canAccess(context: RequestContext): Promise<PolicyDecision>
  canManage(context: RequestContext): Promise<PolicyDecision>
  canInviteUsers(context: RequestContext): Promise<PolicyDecision>
  canManageBilling(context: RequestContext): Promise<PolicyDecision>
}

// ============================================================================
// User Policy Interfaces
// ============================================================================

export interface UserPolicy {
  canView(context: RequestContext, targetUser: { id: string }): Promise<PolicyDecision>
  canCreate(context: RequestContext): Promise<PolicyDecision>
  canUpdate(context: RequestContext, targetUser: { id: string }): Promise<PolicyDecision>
  canDelete(context: RequestContext, targetUser: { id: string }): Promise<PolicyDecision>
  canAssignRole(context: RequestContext, targetUser: { id: string }, role: { id: string }): Promise<PolicyDecision>
  canSuspend(context: RequestContext, targetUser: { id: string }): Promise<PolicyDecision>
  canActivate(context: RequestContext, targetUser: { id: string }): Promise<PolicyDecision>
}

// ============================================================================
// Self Policy Interfaces
// ============================================================================

export interface SelfPolicy {
  canViewOwnProfile(context: RequestContext): Promise<PolicyDecision>
  canUpdateOwnProfile(context: RequestContext): Promise<PolicyDecision>
  canChangeOwnPassword(context: RequestContext): Promise<PolicyDecision>
  canManageOwnTokens(context: RequestContext): Promise<PolicyDecision>
  canDeleteOwnAccount(context: RequestContext): Promise<PolicyDecision>
}

// ============================================================================
// API Rate Limiting Policy
// ============================================================================

export interface RateLimitPolicy {
  readonly windowMs: number
  readonly maxRequests: number
  isAllowed(context: RequestContext): Promise<PolicyDecision>
  getRemainingRequests(context: RequestContext): Promise<number>
  getResetTime(context: RequestContext): Promise<Date>
}

// ============================================================================
// Policy Decision Log
// ============================================================================

export interface PolicyDecisionLog {
  readonly id: string
  readonly requestId: string
  readonly tenantId: string
  readonly userId?: string
  readonly action: string
  readonly resource: string
  readonly decision: PolicyDecision
  readonly timestamp: Date
}

// ============================================================================
// Policy Registry (for plugin system)
// ============================================================================

export interface PolicyRegistry {
  registerPermissionPolicy(policy: PermissionPolicy): void
  unregisterPermissionPolicy(policyName: string): void
  getPermissionPolicy(name: string): PermissionPolicy | null
  registerResourcePolicy(policy: ResourcePolicy): void
  unregisterResourcePolicy(resourceType: string): void
  getResourcePolicy(resourceType: string): ResourcePolicy | null
  registerRolePolicy(roleId: string, policy: RolePolicy): void
  getRolePolicy(roleId: string): RolePolicy | null
}

// ============================================================================
// Default Policies (empty implementation for Phase 1)
// ============================================================================

export const defaultPermissionPolicy: PermissionPolicy = {
  name: 'default',
  description: 'Default permission policy - all access denied in Phase 1',
  async evaluate(_action, _resource, _context) {
    return {
      allowed: false,
      reason: {
        code: 'NOT_IMPLEMENTED',
        message: 'Permission policies not configured yet',
      },
    }
  },
}

export const defaultResourcePolicy: ResourcePolicy = {
  resourceType: 'default',
  async canCreate(_context, _resource) {
    return { allowed: false, reason: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }
  },
  async canRead(_context, _resourceId) {
    return { allowed: false, reason: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }
  },
  async canUpdate(_context, _resource) {
    return { allowed: false, reason: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }
  },
  async canDelete(_context, _resourceId) {
    return { allowed: false, reason: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }
  },
  async canManage(_context, _resourceId) {
    return { allowed: false, reason: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }
  },
}

export const defaultRateLimitPolicy: RateLimitPolicy = {
  windowMs: 60 * 1000,
  maxRequests: 100,
  async isAllowed(_context) {
    return { allowed: true }
  },
  async getRemainingRequests(_context) {
    return 100
  },
  async getResetTime(_context) {
    return new Date(Date.now() + 60 * 1000)
  },
}