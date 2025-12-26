// ============================================================================
// Order Domain Models
// Complete order lifecycle with state machine
// ============================================================================

export interface Order {
  readonly id: string
  readonly tenantId: string
  readonly userId: string
  readonly roleId: string
  readonly serviceId: string
  readonly providerId?: string
  readonly orderNumber: string
  readonly status: OrderStatus
  readonly state: OrderState
  readonly input: OrderInput
  readonly output?: OrderOutput
  readonly pricing: OrderPricing
  readonly wallet: OrderWallet
  readonly timeline: OrderTimeline
  readonly metadata: OrderMetadata
  readonly idempotencyKey: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ============================================================================
// Order Status & State
// ============================================================================

export type OrderStatus = 
  | 'created'
  | 'queued'
  | 'processing'
  | 'success'
  | 'failed'
  | 'refunded'
  | 'cancelled'

export type OrderState = 
  | 'pending'      // Initial state
  | 'validated'    // Input validated
  | 'locked'       // Wallet locked
  | 'submitted'    // Sent to provider
  | 'received'     // Provider acknowledged
  | 'processing'   // Provider processing
  | 'completed'    // Success
  | 'failed'       // Terminal failure
  | 'refunded'     // Money returned
  | 'cancelled'    // User cancelled

// Valid state transitions
export const ORDER_STATE_TRANSITIONS: ReadonlyMap<OrderState, ReadonlyArray<OrderState>> = new Map([
  ['pending', ['validated', 'cancelled']],
  ['validated', ['locked', 'cancelled']],
  ['locked', ['submitted', 'cancelled']],
  ['submitted', ['received', 'failed', 'cancelled']],
  ['received', ['processing', 'failed', 'completed']],
  ['processing', ['completed', 'failed', 'refunded']],
  ['completed', ['refunded']],
  ['failed', []],  // Terminal
  ['refunded', []],  // Terminal
  ['cancelled', []],  // Terminal
])

// ============================================================================
// Order Input & Output
// ============================================================================

export interface OrderInput {
  readonly type: string
  readonly data: Record<string, unknown>
  readonly format?: string
  readonly quantity?: number
  readonly reference?: string
}

export interface OrderOutput {
  readonly status: 'success' | 'failed' | 'partial'
  readonly result?: Record<string, unknown>
  readonly error?: OrderError
  readonly rawResponse?: unknown
  readonly providerOrderId?: string
}

export interface OrderError {
  readonly code: string
  readonly message: string
  readonly recoverable: boolean
  readonly suggestion?: string
}

// ============================================================================
// Order Pricing (Per-Role Profit Calculation)
// ============================================================================

export interface OrderPricing {
  readonly currency: string
  readonly basePrice: number
  readonly markup: number
  readonly markupPercent: number
  readonly finalPrice: number
  readonly profit: number
  readonly providerCost?: number
  readonly breakdown: PricingBreakdown
}

export interface PricingBreakdown {
  readonly basePrice: number
  readonly providerMarkup: number
  readonly distributorMarkup: number
  readonly resellerMarkup: number
  readonly webOwnerMarkup: number
  readonly totalMarkup: number
}

// ============================================================================
// Order Wallet (Locking & Transactions)
// ============================================================================

export interface OrderWallet {
  readonly walletId: string
  readonly lockedAmount: number
  readonly transactionId?: string
  readonly lockExpiresAt?: Date
  readonly refundedAmount?: number
}

// ============================================================================
// Order Timeline (Immutable History)
// ============================================================================

export interface OrderTimeline {
  readonly entries: ReadonlyArray<OrderTimelineEntry>
}

export interface OrderTimelineEntry {
  readonly id: string
  readonly orderId: string
  readonly fromState: OrderState
  readonly toState: OrderState
  readonly event: OrderEvent
  readonly actor?: OrderActor
  readonly details?: Record<string, unknown>
  readonly timestamp: Date
}

export type OrderEvent =
  | 'created'
  | 'validated'
  | 'wallet_locked'
  | 'wallet_lock_failed'
  | 'submitted'
  | 'provider_received'
  | 'provider_processing'
  | 'provider_success'
  | 'provider_failed'
  | 'completed'
  | 'failed'
  | 'refund_initiated'
  | 'refund_completed'
  | 'cancelled'
  | 'user_notification'
  | 'webhook_sent'

export interface OrderActor {
  readonly type: 'user' | 'system' | 'provider' | 'webhook'
  readonly id: string
  readonly name?: string
}

// ============================================================================
// Order Metadata
// ============================================================================

export interface OrderMetadata {
  readonly ipAddress?: string
  readonly userAgent?: string
  readonly source?: string
  readonly priority?: 'low' | 'normal' | 'high' | 'urgent'
  readonly notes?: string
  readonly customFields?: Record<string, unknown>
  readonly webhookConfig?: OrderWebhookConfig
  readonly providerMetadata?: Record<string, unknown>
}

export interface OrderWebhookConfig {
  readonly url: string
  readonly secret: string
  readonly events: ReadonlyArray<string>
}

// ============================================================================
// Order Error Types
// ============================================================================

export class OrderError extends Error {
  readonly code: OrderErrorCode
  readonly orderId?: string
  readonly state?: OrderState
  readonly recoverable: boolean

  constructor(
    code: OrderErrorCode,
    message: string,
    orderId?: string,
    state?: OrderState,
    recoverable = false
  ) {
    super(message)
    this.code = code
    this.name = 'OrderError'
    this.orderId = orderId
    this.state = state
    this.recoverable = recoverable
  }
}

export type OrderErrorCode =
  | 'INVALID_INPUT'
  | 'VALIDATION_FAILED'
  | 'WALLET_LOCK_FAILED'
  | 'INSUFFICIENT_FUNDS'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_REJECTED'
  | 'ALREADY_PROCESSED'
  | 'STATE_TRANSITION_INVALID'
  | 'REFUND_FAILED'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'

// ============================================================================
// Order Filters (for Listing)
// ============================================================================

export interface OrderFilters {
  readonly tenantId?: string
  readonly userId?: string
  readonly serviceId?: string
  readonly status?: OrderStatus | ReadonlyArray<OrderStatus>
  readonly state?: OrderState | ReadonlyArray<OrderState>
  readonly fromDate?: Date
  readonly toDate?: Date
  readonly minAmount?: number
  readonly maxAmount?: number
  readonly reference?: string
}

export interface OrderSort {
  readonly field: 'createdAt' | 'updatedAt' | 'finalPrice' | 'orderNumber'
  readonly direction: 'asc' | 'desc'
}

// ============================================================================
// Order Statistics
// ============================================================================

export interface OrderStatistics {
  readonly tenantId: string
  readonly period: 'day' | 'week' | 'month' | 'all'
  readonly totalOrders: number
  readonly successfulOrders: number
  readonly failedOrders: number
  readonly refundedOrders: number
  readonly totalRevenue: number
  readonly totalProfit: number
  readonly averageOrderValue: number
  readonly averageProcessingTime: number
  readonly byStatus: ReadonlyArray<{ status: OrderStatus; count: number }>
  readonly byService: ReadonlyArray<{ serviceId: string; count: number }>
}

// ============================================================================
// Order ID Generation
// ============================================================================

export function generateOrderNumber(tenantSlug: string, sequence: number): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const seq = sequence.toString().padStart(6, '0')
  return `${tenantSlug.toUpperCase()}-${year}${month}${day}-${seq}`
}

export function parseOrderNumber(orderNumber: string): { tenantSlug: string; date: Date; sequence: number } | null {
  const match = orderNumber.match(/^([A-Z]+)-(\d{2})(\d{2})(\d{2})-(\d{6})$/)
  if (!match) return null
  
  const [, tenantSlug, year, month, day, sequence] = match
  return {
    tenantSlug,
    date: new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day)),
    sequence: parseInt(sequence),
  }
}
