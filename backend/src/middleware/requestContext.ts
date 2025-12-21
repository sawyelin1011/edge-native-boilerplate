import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '../index'
import { createDb } from '../db/client'
import { getConfig } from '../config'

export const requestContextMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)

  const config = getConfig(c.env as unknown as Record<string, unknown>)
  c.set('config', config)
  c.set('csrfToken', null)

  c.set('db', createDb(c.env.DB))

  await next()

  c.res.headers.set('X-Request-ID', requestId)
})
