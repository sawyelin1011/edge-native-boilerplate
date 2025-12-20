import type { AuthProvider, AuthContext, AuthUser } from '../types'
import { createApiError } from '../../../lib/http/errors'
import { hashPassword, verifyPassword } from '../../../lib/password'
import { createJWT, verifyJWT } from '../../../lib/jwt'
import { createSession, deleteSession, getSession, rotateSession } from '../session'
import { issueRefreshToken, revokeRefreshToken, rotateRefreshToken } from '../refreshToken'
import { createUser, findUserByEmail, findUserById, findUserForLoginByEmail, updateUserLastLogin } from '../../../db/repositories/users'

function toAuthUser(user: { id: string; email: string; name: string; role: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === 'admin' ? 'admin' : 'user'
  }
}

function parseCookie(header: string | null): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  const parts = header.split(';')
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=')
    if (!k) continue
    out[k] = decodeURIComponent(v.join('='))
  }
  return out
}

async function issueAccessToken(ctx: AuthContext, user: AuthUser): Promise<string> {
  return createJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    secret: ctx.config.auth.jwt.secret,
    ttlSeconds: ctx.config.auth.jwt.accessTtlSeconds
  })
}

export const defaultAuthProvider: AuthProvider = {
  async register(ctx, params) {
    const existing = await findUserByEmail(ctx.db, params.email)
    if (existing) {
      throw createApiError({ status: 409, code: 'CONFLICT', message: 'User already exists' })
    }

    const passwordHash = await hashPassword(params.password)

    const user = await ctx.db.transaction(async (tx) => {
      const created = await createUser(tx, {
        email: params.email,
        name: params.name,
        role: 'user',
        passwordHash
      })

      return created
    })

    const authUser = toAuthUser(user)
    const accessToken = await issueAccessToken(ctx, authUser)
    const refreshToken = await issueRefreshToken({
      kv: ctx.kv,
      userId: authUser.id,
      ttlSeconds: ctx.config.auth.jwt.refreshTtlSeconds
    })

    const session = ctx.config.auth.session.enabled
      ? await createSession({ kv: ctx.kv, user: authUser, ttlSeconds: ctx.config.auth.session.ttlSeconds })
      : null

    return {
      user: authUser,
      sessionId: session?.sessionId,
      csrfToken: session?.csrfToken,
      accessToken,
      refreshToken: refreshToken.token
    }
  },

  async login(ctx, params) {
    const user = await findUserForLoginByEmail(ctx.db, params.email)
    if (!user || !user.passwordHash) {
      throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    }

    const ok = await verifyPassword({ password: params.password, storedHash: user.passwordHash })
    if (!ok) {
      throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    }

    const authUser = toAuthUser(user)
    await updateUserLastLogin(ctx.db, authUser.id)

    const accessToken = await issueAccessToken(ctx, authUser)
    const refreshToken = await issueRefreshToken({
      kv: ctx.kv,
      userId: authUser.id,
      ttlSeconds: ctx.config.auth.jwt.refreshTtlSeconds
    })

    const session = ctx.config.auth.session.enabled
      ? await createSession({ kv: ctx.kv, user: authUser, ttlSeconds: ctx.config.auth.session.ttlSeconds })
      : null

    return {
      user: authUser,
      sessionId: session?.sessionId,
      csrfToken: session?.csrfToken,
      accessToken,
      refreshToken: refreshToken.token
    }
  },

  async authenticate(ctx, params) {
    const authHeader = params.request.headers.get('Authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length)
      const payload = await verifyJWT({ token, secret: ctx.config.auth.jwt.secret })
      if (!payload) return { ok: false, reason: 'UNAUTHORIZED' }

      const user = await findUserById(ctx.db, payload.sub)
      if (!user) return { ok: false, reason: 'UNAUTHORIZED' }

      return { ok: true, user: toAuthUser(user) }
    }

    if (ctx.config.auth.session.enabled) {
      const cookies = parseCookie(params.request.headers.get('Cookie'))
      const sessionId = cookies[ctx.config.auth.session.cookieName]
      if (!sessionId) return { ok: false, reason: 'UNAUTHORIZED' }

      const session = await getSession({ kv: ctx.kv, sessionId })
      if (!session) return { ok: false, reason: 'UNAUTHORIZED' }

      const last = Date.parse(session.lastRotatedAt)
      const rotateAfterMs = ctx.config.auth.session.rotateEverySeconds * 1000
      const shouldRotate = Number.isFinite(last) && Date.now() - last > rotateAfterMs

      if (!shouldRotate) {
        return { ok: true, user: session.user, sessionId: session.sessionId, csrfToken: session.csrfToken }
      }

      const next = await rotateSession({ kv: ctx.kv, session, ttlSeconds: ctx.config.auth.session.ttlSeconds })
      return { ok: true, user: next.user, sessionId: next.sessionId, csrfToken: next.csrfToken }
    }

    return { ok: false, reason: 'UNAUTHORIZED' }
  },

  async logout(ctx, params) {
    if (params.sessionId) {
      await deleteSession({ kv: ctx.kv, sessionId: params.sessionId })
    }

    if (params.refreshToken) {
      await revokeRefreshToken({ kv: ctx.kv, refreshToken: params.refreshToken })
    }
  },

  async refresh(ctx, params) {
    const rotated = await rotateRefreshToken({
      kv: ctx.kv,
      refreshToken: params.refreshToken,
      ttlSeconds: ctx.config.auth.jwt.refreshTtlSeconds
    })

    if (!rotated) {
      throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' })
    }

    const user = await findUserById(ctx.db, rotated.userId)
    if (!user) {
      throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' })
    }

    const authUser = toAuthUser(user)

    const accessToken = await issueAccessToken(ctx, authUser)
    return {
      accessToken,
      refreshToken: rotated.refreshToken
    }
  }
}
