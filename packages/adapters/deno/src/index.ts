// Deno Deploy adapter - Simplified
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

export interface DenoDeployBindings {
  DB?: unknown
  KV?: unknown
  QUEUE?: unknown
  [key: string]: unknown
}

// ============================================================================
// Runtime Context
// ============================================================================

export class DenoDeployRuntimeContext implements RuntimeContext {
  readonly requestId: string
  readonly tenantId: string | null
  readonly userId: string | null
  readonly timestamp: Date
  readonly env: RuntimeEnvironment
  private readonly waitUntilFn: (promise: Promise<unknown>) => void

  constructor(headers: Record<string, string>, bindings: DenoDeployBindings, ctx: { waitUntil?: (promise: Promise<unknown>) => void }) {
    this.requestId = crypto.randomUUID?.() || 'unknown'
    this.tenantId = headers['x-tenant-id'] || null
    this.userId = headers['x-user-id'] || null
    this.timestamp = new Date()
    this.env = { DB: bindings.DB || null, KV: bindings.KV || null, BUCKET: null, QUEUE: bindings.QUEUE || null }
    this.waitUntilFn = ctx.waitUntil || (() => {})
  }

  get waitUntil(): (promise: Promise<unknown>) => void {
    return this.waitUntilFn
  }
}

// ============================================================================
// Runtime Capabilities
// ============================================================================

export const denoDeployCapabilities: RuntimeCapabilities = {
  type: 'deno',
  supportsWaitUntil: true,
  supportsCron: false,
  supportsWebCrypto: true,
  supportsStreams: true,
  supportsFetch: true,
}

// ============================================================================
// Database Adapter
// ============================================================================

export class DenoDeployDatabaseAdapter implements DatabaseAdapter {
  constructor(private db: unknown) {}

  async query<T>(_sql: string, _params?: unknown[]): Promise<T> {
    throw new Error('Database not configured for Deno Deploy')
  }

  async execute<T>(_sql: string, _params?: unknown[]): Promise<T> {
    throw new Error('Database not configured for Deno Deploy')
  }

  async transaction<T>(_fn: (tx: any) => Promise<T>): Promise<T> {
    throw new Error('Transactions not fully supported in Deno Deploy')
  }

  async getConnectionInfo(): Promise<{ dialect: string; version: string }> {
    return { dialect: 'sqlite', version: 'unknown' }
  }
}

// ============================================================================
// KV Adapter
// ============================================================================

export class DenoDeployKVAdapter implements KVAdapter {
  constructor(private kv: unknown) {}

  async get<T>(_key: string): Promise<T | null> {
    throw new Error('KV not configured for Deno Deploy')
  }

  async set<T>(_key: string, _value: T, _options?: { expiration?: number; expirationTtl?: number }): Promise<void> {
    throw new Error('KV not configured for Deno Deploy')
  }

  async delete(_key: string): Promise<void> {
    throw new Error('KV not configured for Deno Deploy')
  }

  async list(_options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; listComplete: boolean; cursor: string }> {
    throw new Error('KV not configured for Deno Deploy')
  }
}

// ============================================================================
// Queue Adapter
// ============================================================================

export class DenoDeployQueueAdapter implements QueueAdapter {
  constructor(private queue: unknown) {}

  async send(_message: unknown, _options?: { delay?: number }): Promise<void> {
    throw new Error('Queue not configured for Deno Deploy')
  }

  async sendBatch(_messages: Array<unknown>, _options?: { delay?: number }): Promise<void> {
    throw new Error('Queue not configured for Deno Deploy')
  }

  async process<T>(_handler: (message: T) => Promise<void>): Promise<void> {
    throw new Error('Use queue consumer routes instead')
  }
}

// ============================================================================
// Crypto Adapter
// ============================================================================

export class DenoDeployCryptoAdapter implements CryptoAdapter {
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

export class DenoDeployLoggerAdapter implements LoggerAdapter {
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

export function createDenoDeployAdapterRegistry(bindings: DenoDeployBindings): AdapterRegistry {
  return {
    database: new DenoDeployDatabaseAdapter(bindings.DB),
    kv: new DenoDeployKVAdapter(bindings.KV),
    queue: new DenoDeployQueueAdapter(bindings.QUEUE),
    crypto: new DenoDeployCryptoAdapter(),
    logger: new DenoDeployLoggerAdapter(),
  }
}
