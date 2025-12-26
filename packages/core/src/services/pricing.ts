// ============================================================================
// Pricing Service Interface
// Role-based markup with profit calculation
// ============================================================================

import type { RequestContext } from '../models'
import type {
  Service,
  ServicePricing,
  Provider,
  PricingLimits,
} from './service'
import type { OrderPricing, PricingBreakdown } from './order'

// ============================================================================
// Service Interface
// ============================================================================

export interface PricingService {
  // Base Price Management
  setBasePrice(serviceId: string, price: number, context: RequestContext): Promise<Result<Service, PricingError>>
  getBasePrice(serviceId: string, context: RequestContext): Promise<Result<number, PricingError>>
  
  // Markup Management
  setMarkup(
    serviceId: string,
    roleId: string,
    markup: number,
    markupType: 'fixed' | 'percentage',
    context: RequestContext
  ): Promise<Result<RoleMarkup, PricingError>>
  
  getMarkup(serviceId: string, roleId: string, context: RequestContext): Promise<Result<RoleMarkup | null, PricingError>>
  
  getMarkupsForService(serviceId: string, context: RequestContext): Promise<Result<ReadonlyArray<RoleMarkup>, PricingError>>
  
  deleteMarkup(serviceId: string, roleId: string, context: RequestContext): Promise<Result<void, PricingError>>
  
  // Price Calculation
  calculatePrice(
    serviceId: string,
    roleId: string,
    quantity?: number,
    context?: RequestContext
  ): Promise<Result<CalculatedPrice, PricingError>>
  
  calculateOrderPricing(
    serviceId: string,
    roleId: string,
    userRoleId: string,
    quantity: number,
    context: RequestContext
  ): Promise<Result<OrderPricing, PricingError>>
  
  // Profit Calculation
  calculateProfit(
    serviceId: string,
    buyerRoleId: string,
    quantity: number,
    context: RequestContext
  ): Promise<Result<ProfitBreakdown, PricingError>>
  
  // Price History
  getPriceHistory(
    serviceId: string,
    options: PriceHistoryOptions,
    context: RequestContext
  ): Promise<Result<ReadonlyArray<PriceHistoryEntry>, PricingError>>
  
  // Provider Price Sync
  syncProviderPrice(providerId: string, serviceId: string, context: RequestContext): Promise<Result<number, PricingError>>
  
  // Validation
  validateMarkup(roleId: string, markup: number, markupType: 'fixed' | 'percentage', context: RequestContext): Promise<Result<void, PricingError>>
}

// ============================================================================
// Data Types
// ============================================================================

export interface RoleMarkup {
  readonly id: string
  readonly serviceId: string
  readonly roleId: string
  readonly markupType: 'fixed' | 'percentage'
  readonly markupValue: number
  readonly finalPrice: number
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CalculatedPrice {
  readonly basePrice: number
  readonly providerPrice?: number
  readonly markup: number
  readonly markupPercent: number
  readonly finalPrice: number
  readonly currency: string
  readonly breakdown: PriceBreakdownDetail
}

export interface PriceBreakdownDetail {
  readonly base: number
  readonly providerMarkup: number
  readonly distributorMarkup: number
  readonly resellerMarkup: number
  readonly webOwnerMarkup: number
}

export interface ProfitBreakdown {
  readonly serviceId: string
  readonly quantity: number
  readonly basePrice: number
  readonly finalPrice: number
  readonly totalRevenue: number
  readonly providerCost: number
  readonly totalProfit: number
  readonly profitByRole: ReadonlyArray<RoleProfit>
}

export interface RoleProfit {
  readonly roleId: string
  readonly roleName: string
  readonly markup: number
  readonly profit: number
}

export interface PriceHistoryEntry {
  readonly id: string
  readonly serviceId: string
  readonly type: 'base' | 'markup' | 'provider_sync'
  readonly oldValue: number
  readonly newValue: number
  readonly changedBy: string
  readonly reason?: string
  readonly createdAt: Date
}

export interface PriceHistoryOptions {
  readonly limit?: number
  readonly offset?: number
  readonly type?: 'base' | 'markup' | 'provider_sync'
  readonly fromDate?: Date
  readonly toDate?: Date
}

// ============================================================================
// Error Types
// ============================================================================

export class PricingError extends Error {
  readonly code: PricingErrorCode
  readonly serviceId?: string
  readonly roleId?: string
  readonly details?: Record<string, unknown>

  constructor(
    code: PricingErrorCode,
    message: string,
    serviceId?: string,
    roleId?: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PricingError'
    this.code = code
    this.serviceId = serviceId
    this.roleId = roleId
    this.details = details
  }
}

export type PricingErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_PRICE'
  | 'MARKUP_EXCEEDS_LIMIT'
  | 'MARKUP_NOT_ALLOWED'
  | 'PERMISSION_DENIED'
  | 'PROVIDER_SYNC_FAILED'
  | 'SERVICE_NOT_ACTIVE'
  | 'CURRENCY_MISMATCH'

// ============================================================================
// Result Type
// ============================================================================

export type Result<T, E = PricingError> =
  | { success: true; data: T }
  | { success: false; error: E }

// ============================================================================
// Default Implementation Stub
// ============================================================================

export const pricingService: PricingService = {
  async setBasePrice(_serviceId, _price, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async getBasePrice(_serviceId, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async setMarkup(_serviceId, _roleId, _markup, _markupType, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async getMarkup(_serviceId, _roleId, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async getMarkupsForService(_serviceId, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async deleteMarkup(_serviceId, _roleId, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async calculatePrice(_serviceId, _roleId, _quantity, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async calculateOrderPricing(_serviceId, _roleId, _userRoleId, _quantity, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async calculateProfit(_serviceId, _buyerRoleId, _quantity, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async getPriceHistory(_serviceId, _options, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async syncProviderPrice(_providerId, _serviceId, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
  async validateMarkup(_roleId, _markup, _markupType, _context) {
    return { success: false, error: new PricingError('NOT_FOUND', 'Pricing service not implemented') }
  },
}

// ============================================================================
// Factory
// ============================================================================

export interface PricingServiceFactory {
  create(context: RequestContext): PricingService
}
