// ============================================================================
// Order Service Interface
// Complete order lifecycle with state machine
// ============================================================================

import type { RequestContext } from '../models'
import type {
  Order,
  OrderStatus,
  OrderState,
  OrderInput,
  OrderPricing,
  OrderStatistics,
  OrderFilters,
  OrderSort,
  OrderError,
  OrderErrorCode,
  ORDER_STATE_TRANSITIONS,
} from './order'

// ============================================================================
// Service Interface
// ============================================================================

export interface OrderService {
  // Order Lifecycle
  create(input: CreateOrderInput, context: RequestContext): Promise<Result<Order, OrderError>>
  getById(id: string, context: RequestContext): Promise<Result<Order | null, OrderError>>
  getByOrderNumber(orderNumber: string, context: RequestContext): Promise<Result<Order | null, OrderError>>
  updateState(id: string, newState: OrderState, event: string, context: RequestContext): Promise<Result<Order, OrderError>>
  cancel(id: string, reason: string, context: RequestContext): Promise<Result<Order, OrderError>>
  refund(id: string, reason: string, context: RequestContext): Promise<Result<Order, OrderError>>
  
  // Order Queries
  list(tenantId: string, options: ListOrdersOptions, context: RequestContext): Promise<Result<ListOrdersResult, OrderError>>
  count(tenantId: string, filters: OrderFilters, context: RequestContext): Promise<Result<number, OrderError>>
  getByUser(userId: string, options: ListOrdersOptions, context: RequestContext): Promise<Result<ReadonlyArray<Order>, OrderError>>
  
  // State Machine
  validateTransition(currentState: OrderState, newState: OrderState): boolean
  getAvailableTransitions(state: OrderState): ReadonlyArray<OrderState>
  
  // Processing
  processOrder(id: string, context: RequestContext): Promise<Result<void, OrderError>>
  submitToProvider(id: string, context: RequestContext): Promise<Result<void, OrderError>>
  checkProviderStatus(id: string, context: RequestContext): Promise<Result<OrderState, OrderError>>
  handleProviderCallback(id: string, callback: ProviderCallback, context: RequestContext): Promise<Result<void, OrderError>>
  
  // Statistics
  getStatistics(tenantId: string, period: 'day' | 'week' | 'month' | 'all', context: RequestContext): Promise<Result<OrderStatistics, OrderError>>
  
  // Idempotency
  getByIdempotencyKey(idempotencyKey: string, context: RequestContext): Promise<Result<Order | null, OrderError>>
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateOrderInput {
  readonly serviceId: string
  readonly input: OrderInput
  readonly idempotencyKey: string
  readonly priority?: 'low' | 'normal' | 'high' | 'urgent'
  readonly webhookUrl?: string
}

export interface ListOrdersOptions {
  readonly limit?: number
  readonly offset?: number
  readonly filters?: Partial<OrderFilters>
  readonly sort?: OrderSort
}

export interface ListOrdersResult {
  readonly orders: ReadonlyArray<Order>
  readonly total: number
  readonly hasMore: boolean
  readonly nextOffset?: number
}

export interface ProviderCallback {
  readonly providerOrderId?: string
  readonly status: 'success' | 'failed' | 'processing'
  readonly result?: Record<string, unknown>
  readonly error?: {
    readonly code: string
    readonly message: string
    readonly recoverable?: boolean
  }
  readonly timestamp: Date
}

// ============================================================================
// Result Types
// ============================================================================

export type Result<T, E = OrderError> =
  | { success: true; data: T }
  | { success: false; error: E }

// ============================================================================
// Error Factory
// ============================================================================

export function createOrderError(
  code: OrderErrorCode,
  message: string,
  orderId?: string,
  state?: OrderState,
  recoverable = false
): OrderError {
  return new OrderError(code, message, orderId, state, recoverable)
}

// ============================================================================
// Default Implementation Stub
// ============================================================================

export const orderService: OrderService = {
  async create(_input, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order service not implemented') }
  },
  async getById(_id, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async getByOrderNumber(_orderNumber, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async updateState(_id, _newState, _event, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async cancel(_id, _reason, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async refund(_id, _reason, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async list(_tenantId, _options, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order service not implemented') }
  },
  async count(_tenantId, _filters, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order service not implemented') }
  },
  async getByUser(_userId, _options, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order service not implemented') }
  },
  validateTransition(currentState, newState) {
    const allowed = ORDER_STATE_TRANSITIONS.get(currentState) || []
    return allowed.includes(newState)
  },
  getAvailableTransitions(state) {
    return ORDER_STATE_TRANSITIONS.get(state) || []
  },
  async processOrder(_id, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async submitToProvider(_id, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async checkProviderStatus(_id, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async handleProviderCallback(_id, _callback, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
  async getStatistics(_tenantId, _period, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order service not implemented') }
  },
  async getByIdempotencyKey(_idempotencyKey, _context) {
    return { success: false, error: createOrderError('NOT_FOUND', 'Order not found') }
  },
}

// ============================================================================
// Factory
// ============================================================================

export interface OrderServiceFactory {
  create(context: RequestContext): OrderService
}
