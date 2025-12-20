import type { Role } from 'shared'

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'posts:read'
  | 'posts:write'
  | 'products:read'
  | 'products:write'
  | 'admin'

const rolePermissions: Record<Role, readonly Permission[]> = {
  admin: ['admin', 'users:read', 'users:write', 'posts:read', 'posts:write', 'products:read', 'products:write'],
  user: ['posts:read', 'products:read']
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role] ?? []
  return perms.includes('admin') || perms.includes(permission)
}
