import type { Role } from 'shared'

export type Permission =
  | 'admin'
  | 'users:read'
  | 'users:write'
  | 'services:read'
  | 'services:write'
  | 'orders:read'
  | 'orders:write'
  | 'payments:read'
  | 'payments:write'
  | 'plugins:read'
  | 'plugins:write'
  | 'settings:read'
  | 'settings:write'
  | 'posts:read'
  | 'posts:write'
  | 'products:read'
  | 'products:write'

const rolePermissions: Record<Role, readonly Permission[]> = {
  ADMIN: [
    'admin',
    'users:read',
    'users:write',
    'services:read',
    'services:write',
    'orders:read',
    'orders:write',
    'payments:read',
    'payments:write',
    'plugins:read',
    'plugins:write',
    'settings:read',
    'settings:write',
    'posts:read',
    'posts:write',
    'products:read',
    'products:write'
  ],
  WEB_OWNER: ['services:read', 'orders:read', 'payments:read', 'settings:read'],
  DISTRIBUTOR: ['services:read', 'orders:read', 'orders:write', 'payments:read'],
  RESELLER: ['services:read', 'orders:read', 'orders:write', 'payments:read'],
  USER: ['services:read', 'orders:read', 'orders:write', 'payments:read']
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role] ?? []
  return perms.includes('admin') || perms.includes(permission)
}
