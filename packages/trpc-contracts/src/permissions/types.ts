// GSMFlow tRPC Permission System
// Permission checking for procedures

import type { PermissionAction } from '@gsmflow/core'

// ============================================================================
// Permission Types
// ============================================================================

export interface Permission {
  readonly id: string
  readonly resource: string
  readonly action: PermissionAction
  readonly description: string
}

export interface RolePermissions {
  readonly roleId: string
  readonly permissions: ReadonlyArray<string>
}

export interface UserPermissions {
  readonly userId: string
  readonly tenantId: string
  readonly roles: ReadonlyArray<string>
  readonly permissions: ReadonlyArray<string>
}

// ============================================================================
// Permission Checker
// ============================================================================

export class PermissionChecker {
  constructor(private userPermissions: UserPermissions) {}

  can(action: PermissionAction, resource: string): boolean {
    // Phase 1: All permissions denied until business logic
    return false
  }

  canAny(requirements: Array<{ action: PermissionAction; resource: string }>): boolean {
    return requirements.some(r => this.can(r.action, r.resource))
  }

  canAll(requirements: Array<{ action: PermissionAction; resource: string }>): boolean {
    return requirements.every(r => this.can(r.action, r.resource))
  }

  hasPermission(permissionId: string): boolean {
    return this.userPermissions.permissions.includes(permissionId)
  }

  hasAnyPermission(permissionIds: ReadonlyArray<string>): boolean {
    return permissionIds.some(id => this.hasPermission(id))
  }

  hasRole(roleId: string): boolean {
    return this.userPermissions.roles.includes(roleId)
  }

  hasAnyRole(roleIds: ReadonlyArray<string>): boolean {
    return roleIds.some(id => this.hasRole(id))
  }
}

// ============================================================================
// Permission Definitions (Foundation Only)
// ============================================================================

export const BASE_PERMISSIONS: ReadonlyArray<Permission> = [
  // Auth permissions
  { id: 'auth:read', resource: 'auth', action: 'read', description: 'View auth settings' },
  { id: 'auth:manage', resource: 'auth', action: 'manage', description: 'Manage auth settings' },
  
  // User permissions
  { id: 'users:read', resource: 'users', action: 'read', description: 'View users' },
  { id: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
  { id: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
  { id: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { id: 'users:manage', resource: 'users', action: 'manage', description: 'Manage all user aspects' },
  
  // Tenant permissions
  { id: 'tenant:read', resource: 'tenant', action: 'read', description: 'View tenant settings' },
  { id: 'tenant:update', resource: 'tenant', action: 'update', description: 'Update tenant settings' },
  { id: 'tenant:manage', resource: 'tenant', action: 'manage', description: 'Manage tenant' },
  
  // Health permissions
  { id: 'health:read', resource: 'health', action: 'read', description: 'View health status' },
]

// ============================================================================
// Role Definitions (Foundation Only)
// ============================================================================

export const BASE_ROLES: ReadonlyArray<RolePermissions> = [
  {
    roleId: 'super_admin',
    permissions: BASE_PERMISSIONS.map(p => p.id),
  },
  {
    roleId: 'admin',
    permissions: [
      'auth:read',
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'tenant:read',
      'tenant:update',
      'health:read',
    ],
  },
  {
    roleId: 'user',
    permissions: [
      'auth:read',
      'health:read',
    ],
  },
  {
    roleId: 'guest',
    permissions: [
      'health:read',
    ],
  },
]

// ============================================================================
// Permission Utilities
// ============================================================================

export function hasPermission(
  userPermissions: ReadonlyArray<string>,
  required: { action: PermissionAction; resource: string }
): boolean {
  // Phase 1: All access denied
  return false
}

export function requirePermission(
  userPermissions: ReadonlyArray<string>,
  required: { action: PermissionAction; resource: string }
): void {
  if (!hasPermission(userPermissions, required)) {
    throw new Error(`Permission denied: ${required.action}:${required.resource}`)
  }
}

export function requireAnyPermission(
  userPermissions: ReadonlyArray<string>,
  required: ReadonlyArray<{ action: PermissionAction; resource: string }>
): void {
  const hasAny = required.some(r => hasPermission(userPermissions, r))
  if (!hasAny) {
    throw new Error(`Permission denied: requires one of ${required.map(r => r.action + ':' + r.resource).join(', ')}`)
  }
}
