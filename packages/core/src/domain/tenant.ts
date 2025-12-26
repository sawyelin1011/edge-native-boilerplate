// ============================================================================
// Tenant Domain Models
// Multi-tenant isolation is the foundation of GSMFlow
// ============================================================================

export interface Tenant {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly status: TenantStatus
  readonly settings: TenantSettings
  readonly metadata: TenantMetadata
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'archived'

export interface TenantSettings {
  readonly features: TenantFeatures
  readonly limits: TenantLimits
  readonly branding: TenantBranding
}

export interface TenantFeatures {
  readonly allowApiKeys: boolean
  readonly allowWebhooks: boolean
  readonly allowResellers: boolean
  readonly maxApiKeys: number
  readonly maxUsers: number
  readonly maxServices: number
}

export interface TenantLimits {
  readonly maxUsers: number
  readonly maxApiCalls: number
  readonly maxWalletBalance: number
  readonly maxOrderValue: number
}

export interface TenantBranding {
  readonly primaryColor: string
  readonly logoUrl: string
  readonly domain?: string
}

export interface TenantMetadata {
  readonly plan: 'free' | 'starter' | 'professional' | 'enterprise'
  readonly billingEmail?: string
  readonly notes?: string
}

// ============================================================================
// User Domain Models
// ============================================================================

export interface User {
  readonly id: string
  readonly tenantId: string
  readonly email: string
  readonly name: string
  readonly roleId: string
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
// Role Domain Models (Data-Driven)
// ============================================================================

export interface Role {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly description: string
  readonly level: number  // Hierarchy level (0 = highest)
  readonly permissions: RolePermissions
  readonly scopes: RoleScopes
  readonly pricingLimits: PricingLimits
  readonly dashboardConfig: DashboardConfig
  readonly isSystem: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface RolePermissions {
  readonly actions: ReadonlyArray<PermissionAction>
  readonly resources: ReadonlyArray<string>
  readonly wildcardResources: ReadonlyArray<string>
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'none'

export interface RoleScopes {
  readonly tenant: 'own' | 'all' | 'children' | 'none'
  readonly user: 'own' | 'all' | 'children' | 'none'
  readonly wallet: 'own' | 'all' | 'children' | 'none'
  readonly pricing: 'own' | 'all' | 'children' | 'none'
  readonly order: 'own' | 'all' | 'children' | 'none'
  readonly service: 'own' | 'all' | 'children' | 'none'
  readonly apikey: 'own' | 'all' | 'none'
}

export interface PricingLimits {
  readonly canSetBasePrice: boolean
  readonly canSetMarkup: boolean
  readonly maxMarkupPercent: number
  readonly canViewProviderPrices: boolean
  readonly canOverridePricing: boolean
}

export interface DashboardConfig {
  readonly visibleModules: ReadonlyArray<string>
  readonly defaultView: string
  readonly maxRecordsPerPage: number
}

// Default role templates
export const DEFAULT_ROLES: ReadonlyArray<Omit<Role, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Super Admin',
    description: 'Full platform access',
    level: 0,
    permissions: {
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      resources: ['*'],
      wildcardResources: ['*'],
    },
    scopes: {
      tenant: 'all',
      user: 'all',
      wallet: 'all',
      pricing: 'all',
      order: 'all',
      service: 'all',
      apikey: 'all',
    },
    pricingLimits: {
      canSetBasePrice: true,
      canSetMarkup: true,
      maxMarkupPercent: 100,
      canViewProviderPrices: true,
      canOverridePricing: true,
    },
    dashboardConfig: {
      visibleModules: ['*'],
      defaultView: 'dashboard',
      maxRecords: 100,
    },
    isSystem: true,
  },
  {
    name: 'Admin',
    description: 'Tenant administrator',
    level: 1,
    permissions: {
      actions: ['create', 'read', 'update', 'delete'],
      resources: ['tenant', 'user', 'wallet', 'pricing', 'order', 'service', 'apikey'],
      wildcardResources: [],
    },
    scopes: {
      tenant: 'own',
      user: 'all',
      wallet: 'all',
      pricing: 'all',
      order: 'all',
      service: 'all',
      apikey: 'all',
    },
    pricingLimits: {
      canSetBasePrice: true,
      canSetMarkup: true,
      maxMarkupPercent: 50,
      canViewProviderPrices: true,
      canOverridePricing: false,
    },
    dashboardConfig: {
      visibleModules: ['dashboard', 'users', 'wallet', 'pricing', 'orders', 'services', 'apikeys'],
      defaultView: 'dashboard',
      maxRecords: 50,
    },
    isSystem: true,
  },
  {
    name: 'Distributor',
    description: 'Can manage resellers and their pricing',
    level: 2,
    permissions: {
      actions: ['create', 'read', 'update'],
      resources: ['user', 'wallet', 'pricing', 'order', 'service'],
      wildcardResources: [],
    },
    scopes: {
      tenant: 'own',
      user: 'children',
      wallet: 'children',
      pricing: 'children',
      order: 'children',
      service: 'own',
      apikey: 'all',
    },
    pricingLimits: {
      canSetBasePrice: false,
      canSetMarkup: true,
      maxMarkupPercent: 30,
      canViewProviderPrices: false,
      canOverridePricing: false,
    },
    dashboardConfig: {
      visibleModules: ['dashboard', 'resellers', 'wallet', 'pricing', 'orders'],
      defaultView: 'dashboard',
      maxRecords: 25,
    },
    isSystem: true,
  },
  {
    name: 'Reseller',
    description: 'Can manage web owners and set their pricing',
    level: 3,
    permissions: {
      actions: ['create', 'read', 'update'],
      resources: ['user', 'wallet', 'pricing', 'order'],
      wildcardResources: [],
    },
    scopes: {
      tenant: 'own',
      user: 'children',
      wallet: 'children',
      pricing: 'children',
      order: 'children',
      service: 'own',
      apikey: 'own',
    },
    pricingLimits: {
      canSetBasePrice: false,
      canSetMarkup: true,
      maxMarkupPercent: 20,
      canViewProviderPrices: false,
      canOverridePricing: false,
    },
    dashboardConfig: {
      visibleModules: ['dashboard', 'webowners', 'wallet', 'pricing', 'orders'],
      defaultView: 'dashboard',
      maxRecords: 20,
    },
    isSystem: true,
  },
  {
    name: 'Web Owner',
    description: 'Can place orders and manage own account',
    level: 4,
    permissions: {
      actions: ['create', 'read'],
      resources: ['user', 'wallet', 'order'],
      wildcardResources: [],
    },
    scopes: {
      tenant: 'own',
      user: 'own',
      wallet: 'own',
      pricing: 'own',
      order: 'own',
      service: 'own',
      apikey: 'own',
    },
    pricingLimits: {
      canSetBasePrice: false,
      canSetMarkup: false,
      maxMarkupPercent: 0,
      canViewProviderPrices: false,
      canOverridePricing: false,
    },
    dashboardConfig: {
      visibleModules: ['dashboard', 'orders', 'wallet'],
      defaultView: 'orders',
      maxRecords: 10,
    },
    isSystem: true,
  },
  {
    name: 'End Customer',
    description: 'Can view and place orders',
    level: 5,
    permissions: {
      actions: ['create', 'read'],
      resources: ['order'],
      wildcardResources: [],
    },
    scopes: {
      tenant: 'own',
      user: 'own',
      wallet: 'own',
      pricing: 'own',
      order: 'own',
      service: 'own',
      apikey: 'none',
    },
    pricingLimits: {
      canSetBasePrice: false,
      canSetMarkup: false,
      maxMarkupPercent: 0,
      canViewProviderPrices: false,
      canOverridePricing: false,
    },
    dashboardConfig: {
      visibleModules: ['orders', 'wallet'],
      defaultView: 'orders',
      maxRecords: 5,
    },
    isSystem: true,
  },
]

// ============================================================================
// API Key Models
// ============================================================================

export interface ApiKey {
  readonly id: string
  readonly tenantId: string
  readonly userId: string
  readonly roleId: string
  readonly name: string
  readonly key: string
  readonly prefix: string  // First 8 chars for identification
  readonly scopes: ReadonlyArray<string>
  readonly rateLimit: RateLimit
  readonly status: ApiKeyStatus
  readonly lastUsedAt?: Date
  readonly expiresAt?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type ApiKeyStatus = 'active' | 'suspended' | 'expired' | 'revoked'

export interface RateLimit {
  readonly requests: number
  readonly window: number  // seconds
}

// ============================================================================
// Domain Events
// ============================================================================

export type TenantEventType =
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.suspended'
  | 'tenant.activated'
  | 'tenant.archived'

export type UserEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.activated'
  | 'user.role_changed'

export type RoleEventType =
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'role.permissions_changed'

export type WalletEventType =
  | 'wallet.credited'
  | 'wallet.debited'
  | 'wallet.locked'
  | 'wallet.unlocked'
  | 'wallet.transferred'

export type PricingEventType =
  | 'pricing.base_set'
  | 'pricing.markup_set'
  | 'pricing.overridden'
  | 'pricing.history_entry'

export type OrderEventType =
  | 'order.created'
  | 'order.queued'
  | 'order.processing'
  | 'order.success'
  | 'order.failed'
  | 'order.refunded'
  | 'order.cancelled'
