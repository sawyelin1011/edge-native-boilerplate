import { createMiddleware } from 'hono/factory'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import type { Bindings, Variables } from '../index'
import { ApiError } from '../lib/http/errors'
import { authProvider } from '../modules/auth/provider'
import { hasPermission, type Permission } from '../modules/auth/rbac'

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
  const config = c.get('config')

  const result = await authProvider.authenticate(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config
    },
    { request: c.req.raw }
  )

  if (!result.ok) {
    throw new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }

  c.set('user', result.user)
  c.set('csrfToken', result.csrfToken ?? null)

  if (config.auth.session.enabled && result.sessionId) {
    const current = getCookie(c, config.auth.session.cookieName) ?? null

    if (current !== result.sessionId) {
      setCookie(c, config.auth.session.cookieName, result.sessionId, {
        httpOnly: true,
        secure: config.environment === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: config.auth.session.ttlSeconds
      })
    }
  }

  await next()
})

export const optionalAuthMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
  const config = c.get('config')

  const result = await authProvider.authenticate(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config
    },
    { request: c.req.raw }
  )

  if (result.ok) {
    c.set('user', result.user)
    c.set('csrfToken', result.csrfToken ?? null)

    if (config.auth.session.enabled && result.sessionId) {
      const current = getCookie(c, config.auth.session.cookieName) ?? null

      if (current !== result.sessionId) {
        setCookie(c, config.auth.session.cookieName, result.sessionId, {
          httpOnly: true,
          secure: config.environment === 'production',
          sameSite: 'Lax',
          path: '/',
          maxAge: config.auth.session.ttlSeconds
        })
      }
    }
  }

  await next()
})

export function requirePermission(permission: Permission) {
  return createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      throw new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
    }

    if (!hasPermission(user.role, permission)) {
      throw new ApiError({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' })
    }

    await next()
  })
}

export const logoutCookie = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
  const config = c.get('config')
  if (config.auth.session.enabled) {
    deleteCookie(c, config.auth.session.cookieName, { path: '/' })
  }
  await next()
})
