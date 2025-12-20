/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database
  KV: KVNamespace
  BUCKET?: R2Bucket

  ENVIRONMENT?: string
  LOG_LEVEL?: string

  CORS_ORIGINS?: string
  CORS_CREDENTIALS?: string

  JWT_SECRET?: string
  JWT_ACCESS_TTL_SECONDS?: string
  JWT_REFRESH_TTL_SECONDS?: string

  SESSION_SECRET?: string
  SESSION_ENABLED?: string
  SESSION_COOKIE_NAME?: string
  SESSION_TTL_SECONDS?: string
  SESSION_ROTATE_EVERY_SECONDS?: string

  RATE_LIMIT_ENABLED?: string
  RATE_LIMIT_WINDOW_SECONDS?: string
  RATE_LIMIT_MAX_REQUESTS?: string

  STORAGE_ENABLED?: string
  STORAGE_SIGNING_SECRET?: string
}

export {}
