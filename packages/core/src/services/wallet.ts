// ============================================================================
// Wallet Service Interface
// Atomic wallet operations with full audit trail
// ============================================================================

import type { RequestContext } from '../models'
import type {
  Wallet,
  WalletTransaction,
  WalletLock,
  WalletTransfer,
  WalletSummary,
  WalletError,
  WalletErrorCode,
  WalletCreditParams,
  WalletDebitParams,
  WalletLockParams,
  WalletUnlockParams,
  WalletRefundParams,
  WalletTransferParams,
  WalletTransactionType,
} from './wallet'

// ============================================================================
// Service Interface
// ============================================================================

export interface WalletService {
  // Wallet CRUD
  getWallet(id: string, context: RequestContext): Promise<Result<Wallet, WalletError>>
  getWalletByTenantAndRole(tenantId: string, roleId: string, context: RequestContext): Promise<Result<Wallet, WalletError>>
  getWalletsByTenant(tenantId: string, context: RequestContext): Promise<Result<ReadonlyArray<Wallet>, WalletError>>
  
  // Credit Operations
  credit(params: WalletCreditParams, context: RequestContext): Promise<Result<WalletTransaction, WalletError>>
  creditBatch(
    walletId: string,
    credits: Array<Omit<WalletCreditParams, 'walletId'>>,
    context: RequestContext
  ): Promise<Result<ReadonlyArray<WalletTransaction>, WalletError>>
  
  // Debit Operations
  debit(params: WalletDebitParams, context: RequestContext): Promise<Result<WalletTransaction, WalletError>>
  
  // Lock Operations (for Order Processing)
  lockForOrder(params: WalletLockParams, context: RequestContext): Promise<Result<WalletLock, WalletError>>
  releaseLock(params: WalletUnlockParams, context: RequestContext): Promise<Result<WalletLock, WalletError>>
  convertLockToDebit(lockId: string, context: RequestContext): Promise<Result<WalletTransaction, WalletError>>
  getActiveLocks(walletId: string, context: RequestContext): Promise<Result<ReadonlyArray<WalletLock>, WalletError>>
  
  // Refund Operations
  refund(params: WalletRefundParams, context: RequestContext): Promise<Result<WalletTransaction, WalletError>>
  
  // Transfer Operations (Between Wallets)
  transfer(params: WalletTransferParams, context: RequestContext): Promise<Result<WalletTransfer, WalletError>>
  
  // Transaction History
  getTransactions(
    walletId: string,
    options: TransactionHistoryOptions,
    context: RequestContext
  ): Promise<Result<ReadonlyArray<WalletTransaction>, WalletError>>
  
  // Summary & Reporting
  getSummary(tenantId: string, context: RequestContext): Promise<Result<WalletSummary, WalletError>>
  getBalanceHistory(
    walletId: string,
    fromDate: Date,
    toDate: Date,
    context: RequestContext
  ): Promise<Result<ReadonlyArray<{ date: Date; balance: number }>, WalletError>>
}

// ============================================================================
// Input Types
// ============================================================================

export interface TransactionHistoryOptions {
  readonly limit?: number
  readonly offset?: number
  readonly type?: WalletTransactionType | ReadonlyArray<WalletTransactionType>
  readonly fromDate?: Date
  readonly toDate?: Date
  readonly reference?: string
}

// ============================================================================
// Result Types
// ============================================================================

export type Result<T, E = WalletError> =
  | { success: true; data: T }
  | { success: false; error: E }

// ============================================================================
// Error Factory
// ============================================================================

export function createWalletError(
  code: WalletErrorCode,
  message: string,
  walletId?: string,
  transactionId?: string
): WalletError {
  return new WalletError(code, message, walletId, transactionId)
}

// ============================================================================
// Default Implementation Stub
// ============================================================================

export const walletService: WalletService = {
  async getWallet(_id, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async getWalletByTenantAndRole(_tenantId, _roleId, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async getWalletsByTenant(_tenantId, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async credit(_params, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async creditBatch(_walletId, _credits, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async debit(_params, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async lockForOrder(_params, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async releaseLock(_params, _context) {
    return { success: false, error: createWalletError('LOCK_NOT_FOUND', 'Lock not found') }
  },
  async convertLockToDebit(_lockId, _context) {
    return { success: false, error: createWalletError('LOCK_NOT_FOUND', 'Lock not found') }
  },
  async getActiveLocks(_walletId, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async refund(_params, _context) {
    return { success: false, error: createWalletError('TRANSACTION_FAILED', 'Refund failed') }
  },
  async transfer(_params, _context) {
    return { success: false, error: createWalletError('TRANSFER_FAILED', 'Transfer failed') }
  },
  async getTransactions(_walletId, _options, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async getSummary(_tenantId, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
  async getBalanceHistory(_walletId, _fromDate, _toDate, _context) {
    return { success: false, error: createWalletError('WALLET_NOT_FOUND', 'Wallet not found') }
  },
}

// ============================================================================
// Factory (for dependency injection)
// ============================================================================

export interface WalletServiceFactory {
  create(context: RequestContext): WalletService
}
