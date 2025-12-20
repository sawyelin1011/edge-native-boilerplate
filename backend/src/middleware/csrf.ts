import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '../index'
import { ApiError } from '../lib/http/errors'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const csrfMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
  if (!unsafeMethods.has(c.req.method.toUpperCase())) {
    await next()
    return
  }

  const csrfToken = c.get('csrfToken')
  if (!csrfToken) {
    await next()
    return
  }

  const header = c.req.header('X-CSRF-Token')
  if (!header || header !== csrfToken) {
    throw new ApiError({ status: 403, code: 'FORBIDDEN', message: 'CSRF token missing or invalid' })
  }

  await next()
})
