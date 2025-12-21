import type { Role } from 'shared'
import type { Database } from '../../db/client'
import type { AppConfig } from '../../config'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
}

export type AuthContext = {
  db: Database
  kv: KVNamespace
  config: AppConfig
}

export type AuthResult =
  | { ok: true; user: AuthUser; sessionId?: string; csrfToken?: string }
  | { ok: false; reason: 'UNAUTHORIZED' | 'FORBIDDEN' }

export type EmailPasswordCredentials = {
  email: string
  password: string
}

export type RegisterParams = {
  email: string
  name: string
  password: string
}

export type AuthProvider = {
  register: (
    ctx: AuthContext,
    params: RegisterParams
  ) => Promise<{ user: AuthUser; sessionId?: string; csrfToken?: string; accessToken: string; refreshToken: string }>
  login: (
    ctx: AuthContext,
    params: EmailPasswordCredentials
  ) => Promise<{ user: AuthUser; sessionId?: string; csrfToken?: string; accessToken: string; refreshToken: string }>
  authenticate: (ctx: AuthContext, params: { request: Request }) => Promise<AuthResult>
  logout: (ctx: AuthContext, params: { sessionId: string | null; refreshToken: string | null }) => Promise<void>
  refresh: (ctx: AuthContext, params: { refreshToken: string }) => Promise<{ accessToken: string; refreshToken: string }>
}
