// Cloudflare Workers adapter implementation for GSMFlow
// Runtime-specific implementation using Cloudflare Workers APIs

import type {
  RuntimeContext,
  RuntimeEnvironment,
  RequestAdapter,
  ResponseAdapter,
  RuntimeCapabilities,
  DatabaseAdapter,
  TransactionAdapter,
  KVAdapter,
  QueueAdapter,
  CryptoAdapter,
  HMACAdapter,
  LoggerAdapter,
  AdapterRegistry,
} from '@gsmflow/adapters-base'

// ============================================================================
// Environment Types
// ============================================================================

export interface CloudflareBindings {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  QUEUE: QueueNamespace
  [key: string]: unknown
}

// ============================================================================
// Request/Response Adapters
// ============================================================================

export function toRequestAdapter(request: Request): RequestAdapter {
  return {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: null,
    query: parseQueryParams(request.url),
  }
}

export function toResponseAdapter(response: Response): ResponseAdapter {
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: null,
  }
}

function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const urlObj = new URL(url)
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

// ============================================================================
// Runtime Context
// ============================================================================

export class CloudflareRuntimeContext implements RuntimeContext {
  readonly requestId: string
  readonly tenantId: string | null
  readonly userId: string | null
  readonly timestamp: Date
  readonly env: RuntimeEnvironment
  private readonly waitUntilFn: (promise: Promise<unknown>) => void

  constructor(request: Request, bindings: CloudflareBindings, ctx: ExecutionContext) {
    this.requestId = crypto.randomUUID()
    this.tenantId = request.headers.get('X-Tenant-ID')
    this.userId = request.headers.get('X-User-ID')
    this.timestamp = new Date()
    this.env = this.bindEnv(bindings)
    this.waitUntilFn = ctx.waitUntil.bind(ctx)
  }

  private bindEnv(bindings: CloudflareBindings): RuntimeEnvironment {
    return {
      DB: bindings.DB,
      KV: bindings.KV,
      BUCKET: bindings.BUCKET,
      QUEUE: bindings.QUEUE,
      ...Object.fromEntries(
        Object.entries(bindings).filter(([k]) => !['DB', 'KV', 'BUCKET', 'QUEUE'].includes(k))
      ),
    }
  }

  get waitUntil(): (promise: Promise<unknown>) => void {
    return this.waitUntilFn
  }
}

// ============================================================================
// Runtime Capabilities
// ============================================================================

export const cloudflareCapabilities: RuntimeCapabilities = {
  type: 'cloudflare',
  supportsWaitUntil: true,
  supportsCron: true,
  supportsWebCrypto: true,
  supportsStreams: true,
  supportsFetch: true,
}

// ============================================================================
// Database Adapter
// ============================================================================

export class CloudflareDatabaseAdapter implements DatabaseAdapter {
  constructor(private db: D1Database) {}

  async query<T>(sql: string, params?: unknown[]): Promise<T> {
    const stmt = this.db.prepare(sql)
    if (params && params.length > 0) {
      stmt.bind(...params)
    }
    return stmt.first() as Promise<T>
  }

  async execute<T>(sql: string, params?: unknown[]): Promise<T> {
    const stmt = this.db.prepare(sql)
    if (params && params.length > 0) {
      stmt.bind(...params)
    }
    const result = await stmt.all()
    return result.results as T
  }

  async transaction<T>(fn: (tx: TransactionAdapter) => Promise<T>): Promise<T> {
    const batch = this.db.batch([])
    const tx = new CloudflareTransactionAdapter(batch)
    return fn(tx)
  }

  async getConnectionInfo(): Promise<{ dialect: string; version: string }> {
    return { dialect: 'sqlite', version: 'unknown' }
  }
}

class CloudflareTransactionAdapter implements TransactionAdapter {
  private queries: Array<{ sql: string; params: unknown[] }> = []
  private rolledBack = false

  constructor(private batch: D1Batch) {}

  query<T>(sql: string, params?: unknown[]): Promise<T> {
    this.queries.push({ sql, params: params || [] })
    return Promise.resolve({} as T)
  }

  execute<T>(sql: string, params?: unknown[]): Promise<T> {
    this.queries.push({ sql, params: params || [] })
    return Promise.resolve({} as T)
  }

  async commit(): Promise<void> {
    if (this.rolledBack) return
  }

  async rollback(): Promise<void> {
    this.rolledBack = true
    this.queries = []
  }
}

// ============================================================================
// KV Adapter
// ============================================================================

export class CloudflareKVAdapter implements KVAdapter {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json') as T | null
    return value
  }

  async set<T>(key: string, value: T, options?: { expiration?: number; expirationTtl?: number }): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expiration: options?.expiration,
      expirationTtl: options?.expirationTtl,
    })
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key)
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; listComplete: boolean; cursor: string }> {
    const result = await this.kv.list({
      prefix: options?.prefix,
      limit: options?.limit,
      cursor: options?.cursor,
    })
    return {
      keys: result.keys,
      listComplete: result.list_complete,
      cursor: result.cursor,
    }
  }
}

// ============================================================================
// Queue Adapter
// ============================================================================

export class CloudflareQueueAdapter implements QueueAdapter {
  constructor(private queue: QueueNamespace) {}

  async send(message: unknown, options?: { delay?: number }): Promise<void> {
    await this.queue.send(message as any, { delaySeconds: options?.delay })
  }

  async sendBatch(messages: Array<unknown>, options?: { delay?: number }): Promise<void> {
    await this.queue.sendBatch(
      messages.map((m) => ({ body: m })),
      { delaySeconds: options?.delay }
    )
  }

  async process<T>(_handler: (message: T) => Promise<void>): Promise<void> {
    throw new Error('Use queue consumer routes instead')
  }
}

// ============================================================================
// Crypto Adapter
// ============================================================================

export class CloudflareCryptoAdapter implements CryptoAdapter {
  randomUUID(): string {
    return crypto.randomUUID()
  }

  randomBytes(size: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(size))
  }

  async hash(data: string | Uint8Array, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<Uint8Array> {
    const algo = algorithm.replace('SHA-', '').toLowerCase() as Algorithm
    const encoder = new TextEncoder()
    const input = typeof data === 'string' ? encoder.encode(data) : data
    return new Uint8Array(await crypto.subtle.digest(algo, input))
  }

  async createHMAC(algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512', key: Uint8Array): Promise<HMACAdapter> {
    const algo = algorithm.replace('SHA-', '').toLowerCase() as string
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: { name: `SHA-${algo.toUpperCase()}` } },
      false,
      ['sign', 'verify']
    )
    return new CloudflareHMACAdapter(cryptoKey)
  }

  async encrypt(algorithm: string, key: Uint8Array, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: algorithm }, false, ['encrypt'])
    const encrypted = await crypto.subtle.encrypt({ name: algorithm, iv }, cryptoKey, data)
    return new Uint8Array(encrypted)
  }

  async decrypt(algorithm: string, key: Uint8Array, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: algorithm }, false, ['decrypt'])
    const decrypted = await crypto.subtle.decrypt({ name: algorithm, iv }, cryptoKey, data)
    return new Uint8Array(decrypted)
  }
}

class CloudflareHMACAdapter implements HMACAdapter {
  constructor(private key: CryptoKey) {}

  async sign(data: string | Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const input = typeof data === 'string' ? encoder.encode(data) : data
    const signature = await crypto.subtle.sign('HMAC', this.key, input)
    return new Uint8Array(signature)
  }

  async verify(data: string | Uint8Array, signature: Uint8Array): Promise<boolean> {
    const encoder = new TextEncoder()
    const input = typeof data === 'string' ? encoder.encode(data) : data
    return crypto.subtle.verify('HMAC', this.key, signature, input)
  }
}

// ============================================================================
// Logger Adapter
// ============================================================================

export class CloudflareLoggerAdapter implements LoggerAdapter {
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

export function createCloudflareAdapterRegistry(bindings: CloudflareBindings): AdapterRegistry {
  return {
    database: new CloudflareDatabaseAdapter(bindings.DB as D1Database),
    kv: new CloudflareKVAdapter(bindings.KV as KVNamespace),
    queue: new CloudflareQueueAdapter(bindings.QUEUE as QueueNamespace),
    crypto: new CloudflareCryptoAdapter(),
    logger: new CloudflareLoggerAdapter(),
  }
}
