// GSMFlow Core - Domain Models
// Pure TypeScript, runtime-agnostic

// Re-export all domain models
export * from './domain/models'
export * from './domain/tenant'
export * from './domain/wallet'
export * from './domain/service'
export * from './domain/order'

// Re-export policies
export * from './policies/interfaces'

// Re-export services (interfaces only)
export type {
  TenantService,
  TenantServiceFactory,
  TenantError,
  TenantErrorCode,
  Result as TenantResult,
  CreateTenantInput,
  UpdateTenantInput,
  ListTenantsOptions,
} from './services/tenant'

export type {
  WalletService,
  WalletServiceFactory,
  WalletError,
  WalletErrorCode,
  Result as WalletResult,
  WalletCreditParams,
  WalletDebitParams,
  WalletLockParams,
  WalletUnlockParams,
  WalletRefundParams,
  WalletTransferParams,
  TransactionHistoryOptions,
} from './services/wallet'

export type {
  PricingService,
  PricingServiceFactory,
  PricingError,
  PricingErrorCode,
  Result as PricingResult,
  RoleMarkup,
  CalculatedPrice,
  ProfitBreakdown,
  PriceHistoryEntry,
  PriceHistoryOptions,
} from './services/pricing'

export type {
  OrderService,
  OrderServiceFactory,
  OrderError,
  OrderErrorCode,
  Result as OrderResult,
  CreateOrderInput,
  ListOrdersOptions,
  ListOrdersResult,
  ProviderCallback,
} from './services/order'

// Re-export events
export * from './events/interfaces'
