// Base runtime adapter interfaces for GSMFlow
// Runtime-agnostic abstractions for edge environments

// ============================================================================
// Environment & Context
// ============================================================================

export interface RuntimeContext {
  readonly requestId: string
  readonly tenantId: string | null
  readonly userId: string | null
  readonly timestamp: Date
  readonly env: RuntimeEnvironment
  readonly waitUntil: (promise: Promise<unknown>) => void
}

export interface RuntimeEnvironment {
  readonly DB: unknown
  readonly KV: unknown
  readonly BUCKET: unknown
  readonly QUEUE: unknown
  [key: string]: unknown
}

// ============================================================================
// HTTP Request/Response
// ============================================================================

export interface RequestAdapter {
  method: string
  url: string
  headers: Record<string, string>
  body: unknown | null
  query: Record<string, string>
}

export interface ResponseAdapter {
  status: number
  headers: Record<string, string>
  body: unknown
}

// ============================================================================
// Runtime Capabilities
// ============================================================================

export type RuntimeType = 'cloudflare' | 'vercel-edge' | 'deno'

export interface RuntimeCapabilities {
  readonly type: RuntimeType
  readonly supportsWaitUntil: boolean
  readonly supportsCron: boolean
  readonly supportsWebCrypto: boolean
  readonly supportsStreams: boolean
  readonly supportsFetch: boolean
}

// ============================================================================
// Database Adapter Interface
// ============================================================================

export interface DatabaseAdapter {
  query<T>(sql: string, params?: unknown[]): Promise<T>
  execute<T>(sql: string, params?: unknown[]): Promise<T>
  transaction<T>(fn: (tx: TransactionAdapter) => Promise<T>): Promise<T>
  getConnectionInfo(): Promise<{ dialect: string; version: string }>
}

export interface TransactionAdapter {
  query<T>(sql: string, params?: unknown[]): Promise<T>
  execute<T>(sql: string, params?: unknown[]): Promise<T>
  commit(): Promise<void>
  rollback(): Promise<void>
}

// ============================================================================
// KV Storage Adapter Interface
// ============================================================================

export interface KVAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: { expiration?: number; expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; listComplete: boolean; cursor: string }>
}

// ============================================================================
// Queue Adapter Interface
// ============================================================================

export interface QueueAdapter {
  send(message: unknown, options?: { delay?: number }): Promise<void>
  sendBatch(messages: Array<unknown>, options?: { delay?: number }): Promise<void>
  process<T>(handler: (message: T) => Promise<void>): Promise<void>
}

// ============================================================================
// Web Crypto Adapter Interface
// ============================================================================

export interface CryptoAdapter {
  randomUUID(): string
  randomBytes(size: number): Uint8Array
  hash(data: string | Uint8Array, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<Uint8Array>
  createHMAC(algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512', key: Uint8Array): Promise<HMACAdapter>
  encrypt(algorithm: string, key: Uint8Array, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array>
  decrypt(algorithm: string, key: Uint8Array, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array>
}

export interface HMACAdapter {
  sign(data: string | Uint8Array): Promise<Uint8Array>
  verify(data: string | Uint8Array, signature: Uint8Array): Promise<boolean>
}

// ============================================================================
// Logging Adapter Interface
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerAdapter {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
}

// ============================================================================
// Adapter Registry
// ============================================================================

export interface AdapterRegistry {
  readonly database: DatabaseAdapter
  readonly kv: KVAdapter
  readonly queue: QueueAdapter
  readonly crypto: CryptoAdapter
  readonly logger: LoggerAdapter
}
