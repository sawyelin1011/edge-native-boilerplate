// ============================================================================
// Wallet Domain Models
// Critical financial system - atomic operations with full audit trail
// ============================================================================

export interface Wallet {
  readonly id: string
  readonly tenantId: string
  readonly roleId: string
  readonly currency: string
  readonly balance: number
  readonly lockedBalance: number
  readonly availableBalance: number
  readonly status: WalletStatus
  readonly metadata: WalletMetadata
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type WalletStatus = 'active' | 'frozen' | 'closed'

export interface WalletMetadata {
  readonly reference?: string
  readonly notes?: string
  readonly autoLockThreshold?: number
}

// Computed available balance
export function computeAvailableBalance(wallet: Wallet): number {
  return wallet.balance - wallet.lockedBalance
}

// ============================================================================
// Wallet Transaction Models
// ============================================================================

export interface WalletTransaction {
  readonly id: string
  readonly walletId: string
  readonly tenantId: string
  readonly type: WalletTransactionType
  readonly amount: number
  readonly currency: string
  readonly balanceBefore: number
  readonly balanceAfter: number
  readonly lockedBefore: number
  readonly lockedAfter: number
  readonly reference: string
  readonly referenceType?: string
  readonly referenceId?: string
  readonly description: string
  readonly metadata: WalletTransactionMetadata
  readonly idempotencyKey: string
  readonly createdAt: Date
}

export type WalletTransactionType =
  | 'credit'
  | 'debit'
  | 'lock'
  | 'unlock'
  | 'refund'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'

export interface WalletTransactionMetadata {
  readonly userId?: string
  readonly orderId?: string
  readonly reason?: string
  readonly ipAddress?: string
  readonly userAgent?: string
}

// ============================================================================
// Wallet Lock Models (for Order Processing)
// ============================================================================

export interface WalletLock {
  readonly id: string
  readonly walletId: string
  readonly tenantId: string
  readonly orderId: string
  readonly amount: number
  readonly currency: string
  readonly status: WalletLockStatus
  readonly expiresAt: Date
  readonly releasedAt?: Date
  readonly releaseReason?: string
  readonly createdAt: Date
}

export type WalletLockStatus = 'active' | 'released' | 'expired' | 'converted'

// ============================================================================
// Wallet Transfer Models (Between Wallets)
// ============================================================================

export interface WalletTransfer {
  readonly id: string
  readonly fromWalletId: string
  readonly fromTenantId: string
  readonly toWalletId: string
  readonly toTenantId: string
  readonly amount: number
  readonly currency: string
  readonly fee: number
  readonly netAmount: number
  readonly status: WalletTransferStatus
  readonly idempotencyKey: string
  readonly metadata: WalletTransferMetadata
  readonly createdAt: Date
  readonly completedAt?: Date
}

export type WalletTransferStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface WalletTransferMetadata {
  readonly fromUserId?: string
  readonly toUserId?: string
  readonly reason?: string
  readonly notes?: string
}

// ============================================================================
// Wallet Audit Log (Immutable)
// ============================================================================

export interface WalletAuditLog {
  readonly id: string
  readonly tenantId: string
  readonly walletId: string
  readonly transactionId?: string
  readonly action: WalletAuditAction
  readonly previousState: WalletSnapshot
  readonly newState: WalletSnapshot
  readonly userId?: string
  readonly ipAddress?: string
  readonly userAgent?: string
  readonly timestamp: Date
}

export type WalletAuditAction =
  | 'created'
  | 'credited'
  | 'debited'
  | 'locked'
  | 'unlocked'
  | 'transferred'
  | 'adjusted'
  | 'status_changed'
  | 'closed'

export interface WalletSnapshot {
  readonly balance: number
  readonly lockedBalance: number
  readonly status: WalletStatus
}

// ============================================================================
// Wallet Operation Errors
// ============================================================================

export class WalletError extends Error {
  readonly code: WalletErrorCode
  readonly walletId?: string
  readonly transactionId?: string

  constructor(code: WalletErrorCode, message: string, walletId?: string, transactionId?: string) {
    super(message)
    this.code = code
    this.name = 'WalletError'
    this.walletId = walletId
    this.transactionId = transactionId
  }
}

export type WalletErrorCode =
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_AVAILABLE_FUNDS'
  | 'WALLET_NOT_FOUND'
  | 'WALLET_FROZEN'
  | 'WALLET_CLOSED'
  | 'LOCK_NOT_FOUND'
  | 'LOCK_EXPIRED'
  | 'TRANSFER_FAILED'
  | 'DUPLICATE_TRANSACTION'
  | 'INVALID_AMOUNT'
  | 'CURRENCY_MISMATCH'
  | 'TENANT_MISMATCH'
  | 'IDEMPOTENCY_CONFLICT'

// ============================================================================
// Wallet Operation Interfaces
// ============================================================================

export interface WalletOperationResult<T = void> {
  success: boolean
  data?: T
  error?: WalletError
  transaction?: WalletTransaction
}

export interface WalletCreditParams {
  walletId: string
  amount: number
  description: string
  reference?: string
  idempotencyKey: string
  metadata?: Record<string, unknown>
}

export interface WalletDebitParams {
  walletId: string
  amount: number
  description: string
  reference?: string
  idempotencyKey: string
  requireSufficientFunds: boolean
  metadata?: Record<string, unknown>
}

export interface WalletLockParams {
  walletId: string
  orderId: string
  amount: number
  expiresInSeconds: number
  idempotencyKey: string
}

export interface WalletUnlockParams {
  lockId: string
  reason: 'completed' | 'cancelled' | 'expired'
  idempotencyKey: string
}

export interface WalletRefundParams {
  transactionId: string
  amount?: number  // If not specified, full refund
  reason: string
  idempotencyKey: string
}

export interface WalletTransferParams {
  fromWalletId: string
  toWalletId: string
  amount: number
  reason?: string
  idempotencyKey: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Wallet Summary for Reporting
// ============================================================================

export interface WalletSummary {
  readonly tenantId: string
  readonly totalBalance: number
  readonly totalLocked: number
  readonly totalAvailable: number
  readonly currency: string
  readonly walletCount: number
  readonly recentTransactions: ReadonlyArray<WalletTransaction>
  readonly dailyVolume: number
  readonly averageBalance: number
}
