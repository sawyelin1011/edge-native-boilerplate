import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'

import type { Bindings, Variables } from '../../index'
import { ok } from '../../lib/http/response'
import { parseJson } from '../../lib/validation'
import { authMiddleware } from '../../middleware/auth'
import { authProvider } from '../../modules/auth/provider'
import { ApiError } from '../../lib/http/errors'

const RefreshCookieName = 'rt'

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(256)
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256)
})

const RefreshSchema = z.object({
  refreshToken: z.string().min(10).optional()
})

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

auth.post('/register', async (c) => {
  const body = await parseJson(c, RegisterSchema)
  const config = c.get('config')

  const result = await authProvider.register(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config
    },
    body
  )

  if (config.auth.session.enabled && result.sessionId) {
    setCookie(c, config.auth.session.cookieName, result.sessionId, {
      httpOnly: true,
      secure: config.environment === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: config.auth.session.ttlSeconds
    })
  }

  setCookie(c, RefreshCookieName, result.refreshToken, {
    httpOnly: true,
    secure: config.environment === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: config.auth.jwt.refreshTtlSeconds
  })

  c.header('Cache-Control', 'no-store')
  return c.json(
    ok({
      requestId: c.get('requestId'),
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresInSeconds: config.auth.jwt.accessTtlSeconds
        },
        csrfToken: result.csrfToken ?? null
      }
    }),
    { status: 201 }
  )
})

auth.post('/login', async (c) => {
  const body = await parseJson(c, LoginSchema)
  const config = c.get('config')

  const result = await authProvider.login(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config
    },
    body
  )

  if (config.auth.session.enabled && result.sessionId) {
    setCookie(c, config.auth.session.cookieName, result.sessionId, {
      httpOnly: true,
      secure: config.environment === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: config.auth.session.ttlSeconds
    })
  }

  setCookie(c, RefreshCookieName, result.refreshToken, {
    httpOnly: true,
    secure: config.environment === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: config.auth.jwt.refreshTtlSeconds
  })

  c.header('Cache-Control', 'no-store')
  return c.json(
    ok({
      requestId: c.get('requestId'),
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresInSeconds: config.auth.jwt.accessTtlSeconds
        },
        csrfToken: result.csrfToken ?? null
      }
    })
  )
})

auth.post('/refresh', async (c) => {
  const body = await parseJson(c, RefreshSchema)
  const config = c.get('config')
  const refreshToken = body.refreshToken ?? getCookie(c, RefreshCookieName) ?? null

  if (!refreshToken) {
    throw new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Missing refresh token' })
  }

  const result = await authProvider.refresh(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config
    },
    { refreshToken }
  )

  setCookie(c, RefreshCookieName, result.refreshToken, {
    httpOnly: true,
    secure: config.environment === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: config.auth.jwt.refreshTtlSeconds
  })

  c.header('Cache-Control', 'no-store')
  return c.json(
    ok({
      requestId: c.get('requestId'),
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresInSeconds: config.auth.jwt.accessTtlSeconds
      }
    })
  )
})

auth.post('/logout', authMiddleware, async (c) => {
  const config = c.get('config')

  const sessionId = config.auth.session.enabled ? getCookie(c, config.auth.session.cookieName) ?? null : null
  const refreshToken = getCookie(c, RefreshCookieName) ?? null

  await authProvider.logout(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config
    },
    { sessionId, refreshToken }
  )

  if (config.auth.session.enabled) {
    deleteCookie(c, config.auth.session.cookieName, { path: '/' })
  }
  deleteCookie(c, RefreshCookieName, { path: '/' })

  return c.json(ok({ requestId: c.get('requestId'), data: { success: true } }))
})

auth.get('/me', authMiddleware, async (c) => {
  c.header('Cache-Control', 'no-store')
  return c.json(ok({ requestId: c.get('requestId'), data: c.get('user') }))
})

export { auth as authRoutesV1 }
