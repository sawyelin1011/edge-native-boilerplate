import { z } from 'zod'

export type Environment = 'development' | 'test' | 'production'

const BooleanSchema = z
  .union([z.literal('true'), z.literal('false')])
  .transform((v) => v === 'true')

const RawEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  CORS_ORIGINS: z.string().optional(),
  CORS_CREDENTIALS: BooleanSchema.optional().default('true'),

  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60),

  SESSION_SECRET: z.string().min(16),
  SESSION_ENABLED: BooleanSchema.optional().default('true'),
  SESSION_COOKIE_NAME: z.string().min(1).default('sid'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60),
  SESSION_ROTATE_EVERY_SECONDS: z.coerce.number().int().positive().default(24 * 60 * 60),

  RATE_LIMIT_ENABLED: BooleanSchema.optional().default('true'),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),

  STORAGE_ENABLED: BooleanSchema.optional().default('false'),
  STORAGE_SIGNING_SECRET: z.string().min(16).optional()
})

type RawEnv = z.infer<typeof RawEnvSchema>

export type AppConfig = {
  environment: Environment
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  cors: {
    origins: string[] | '*'
    credentials: boolean
  }
  auth: {
    jwt: {
      secret: string
      accessTtlSeconds: number
      refreshTtlSeconds: number
    }
    session: {
      enabled: boolean
      secret: string
      cookieName: string
      ttlSeconds: number
      rotateEverySeconds: number
    }
  }
  rateLimit: {
    enabled: boolean
    windowSeconds: number
    maxRequests: number
  }
  storage: {
    enabled: boolean
    signingSecret: string | null
  }
}

let cached: AppConfig | null = null

function parseCorsOrigins(input: string | undefined): string[] | '*' {
  if (!input) return '*'
  const origins = input
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  return origins.length === 0 ? '*' : origins
}

function normalize(env: RawEnv): AppConfig {
  const config: AppConfig = {
    environment: env.ENVIRONMENT,
    logLevel: env.LOG_LEVEL,
    cors: {
      origins: parseCorsOrigins(env.CORS_ORIGINS),
      credentials: env.CORS_CREDENTIALS
    },
    auth: {
      jwt: {
        secret: env.JWT_SECRET,
        accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
        refreshTtlSeconds: env.JWT_REFRESH_TTL_SECONDS
      },
      session: {
        enabled: env.SESSION_ENABLED,
        secret: env.SESSION_SECRET,
        cookieName: env.SESSION_COOKIE_NAME,
        ttlSeconds: env.SESSION_TTL_SECONDS,
        rotateEverySeconds: env.SESSION_ROTATE_EVERY_SECONDS
      }
    },
    rateLimit: {
      enabled: env.RATE_LIMIT_ENABLED,
      windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS
    },
    storage: {
      enabled: env.STORAGE_ENABLED,
      signingSecret: env.STORAGE_SIGNING_SECRET ?? null
    }
  }

  if (config.environment === 'production') {
    if (!config.auth.jwt.secret || config.auth.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production')
    }

    if (!config.auth.session.secret || config.auth.session.secret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters in production')
    }

    if (config.storage.enabled && (!config.storage.signingSecret || config.storage.signingSecret.length < 32)) {
      throw new Error('STORAGE_SIGNING_SECRET must be at least 32 characters when storage is enabled')
    }
  }

  return config
}

export function getConfig(env: Record<string, unknown>): AppConfig {
  if (cached) return cached
  const raw = RawEnvSchema.parse(env)
  cached = normalize(raw)
  return cached
}
