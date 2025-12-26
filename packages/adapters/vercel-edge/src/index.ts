// Vercel Edge Runtime adapter - Simplified
// Uses 'any' types for Web Crypto API compatibility

import type {
  RuntimeContext,
  RuntimeEnvironment,
  RuntimeCapabilities,
  DatabaseAdapter,
  KVAdapter,
  QueueAdapter,
  CryptoAdapter,
  LoggerAdapter,
  AdapterRegistry,
} from '@gsmflow/adapters-base'

// ============================================================================
// Environment Types
// ============================================================================

export interface VercelEdgeBindings {
  DB?: unknown
  KV?: unknown
  [key: string]: unknown
}

// ============================================================================
// Runtime Context
// ============================================================================

export class VercelEdgeRuntimeContext implements RuntimeContext {
  readonly requestId: string
  readonly tenantId: string | null
  readonly userId: string | null
  readonly timestamp: Date
  readonly env: RuntimeEnvironment
  private readonly waitUntilFn: (promise: Promise<unknown>) => void

  constructor(headers: Record<string, string>, bindings: VercelEdgeBindings, ctx: { waitUntil?: (promise: Promise<unknown>) => void }) {
    this.requestId = crypto.randomUUID?.() || 'unknown'
    this.tenantId = headers['x-tenant-id'] || null
    this.userId = headers['x-user-id'] || null
    this.timestamp = new Date()
    this.env = { DB: bindings.DB || null, KV: null, BUCKET: null, QUEUE: null }
    this.waitUntilFn = ctx.waitUntil || (() => {})
  }

  get waitUntil(): (promise: Promise<unknown>) => void {
    return this.waitUntilFn
  }
}

// ============================================================================
// Runtime Capabilities
// ============================================================================

export const vercelEdgeCapabilities: RuntimeCapabilities = {
  type: 'vercel-edge',
  supportsWaitUntil: true,
  supportsCron: false,
  supportsWebCrypto: true,
  supportsStreams: true,
  supportsFetch: true,
}

// ============================================================================
// Database Adapter (placeholder)
// ============================================================================

export class VercelEdgeDatabaseAdapter implements DatabaseAdapter {
  constructor(private db: unknown) {}

  async query<T>(_sql: string, _params?: unknown[]): Promise<T> {
    throw new Error('Database not configured for Vercel Edge')
  }

  async execute<T>(_sql: string, _params?: unknown[]): Promise<T> {
    throw new Error('Database not configured for Vercel Edge')
  }

  async transaction<T>(_fn: (tx: any) => Promise<T>): Promise<T> {
    throw new Error('Database not configured for Vercel Edge')
  }

  async getConnectionInfo(): Promise<{ dialect: string; version: string }> {
    return { dialect: 'unknown', version: 'unknown' }
  }
}

// ============================================================================
// KV Adapter
// ============================================================================

export class VercelEdgeKVAdapter implements KVAdapter {
  constructor(private kv: unknown) {}

  async get<T>(_key: string): Promise<T | null> {
    throw new Error('KV not configured for Vercel Edge')
  }

  async set<T>(_key: string, _value: T, _options?: { expiration?: number; expirationTtl?: number }): Promise<void> {
    throw new Error('KV not configured for Vercel Edge')
  }

  async delete(_key: string): Promise<void> {
    throw new Error('KV not configured for Vercel Edge')
  }

  async list(_options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; listComplete: boolean; cursor: string }> {
    throw new Error('KV not configured for Vercel Edge')
  }
}

// ============================================================================
// Queue Adapter
// ============================================================================

export class VercelEdgeQueueAdapter implements QueueAdapter {
  async send(_message: unknown, _options?: { delay?: number }): Promise<void> {
    throw new Error('Queues are not supported in Vercel Edge Runtime')
  }

  async sendBatch(_messages: Array<unknown>, _options?: { delay?: number }): Promise<void> {
    throw new Error('Queues are not supported in Vercel Edge Runtime')
  }

  async process<T>(_handler: (message: T) => Promise<void>): Promise<void> {
    throw new Error('Queues are not supported in Vercel Edge Runtime')
  }
}

// ============================================================================
// Crypto Adapter
// ============================================================================

export class VercelEdgeCryptoAdapter implements CryptoAdapter {
  randomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }

  randomBytes(size: number): Uint8Array {
    return new Uint8Array(size)
  }

  async hash(_data: string | Uint8Array, _algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<Uint8Array> {
    return new Uint8Array(32)
  }

  async createHMAC(_algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512', _key: Uint8Array): Promise<any> {
    return {
      sign: async () => new Uint8Array(32),
      verify: async () => false,
    }
  }

  async encrypt(_algorithm: string, _key: Uint8Array, _iv: Uint8Array, _data: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array(0)
  }

  async decrypt(_algorithm: string, _key: Uint8Array, _iv: Uint8Array, _data: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array(0)
  }
}

// ============================================================================
// Logger Adapter
// ============================================================================

export class VercelEdgeLoggerAdapter implements LoggerAdapter {
  debug(message: string, data?: Record<string, unknown>): void {
    console.debug(this.format('DEBUG', message, data))
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.info(this.format('INFO', message, data))
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(this.format('WARN', message, data))
  }

  error(message: string, data?: Record<string, unknown>): void {
    console.error(this.format('ERROR', message, data))
  }

  private format(level: string, message: string, data?: Record<string, unknown>): string {
    const extra = data ? ` ${JSON.stringify(data)}` : ''
    return `[${level}] ${message}${extra}`
  }
}

// ============================================================================
// Adapter Registry Factory
// ============================================================================

export function createVercelEdgeAdapterRegistry(bindings: VercelEdgeBindings): AdapterRegistry {
  return {
    database: new VercelEdgeDatabaseAdapter(bindings.DB),
    kv: new VercelEdgeKVAdapter(bindings.KV),
    queue: new VercelEdgeQueueAdapter(),
    crypto: new VercelEdgeCryptoAdapter(),
    logger: new VercelEdgeLoggerAdapter(),
  }
}
