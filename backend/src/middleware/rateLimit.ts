import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '../index'
import { ApiError } from '../lib/http/errors'

function getClientIp(req: Request): string {
  const header = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')
  if (!header) return 'unknown'
  return header.split(',')[0].trim() || 'unknown'
}

export function rateLimit(params?: { prefix?: string }) {
  return createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
    const config = c.get('config')
    if (!config.rateLimit.enabled) {
      await next()
      return
    }

    const ip = getClientIp(c.req.raw)
    const windowSeconds = config.rateLimit.windowSeconds
    const windowStart = Math.floor(Date.now() / 1000 / windowSeconds)

    const key = `${params?.prefix ?? 'rl'}:${windowStart}:${ip}`

    const currentRaw = await c.env.KV.get(key)
    const current = currentRaw ? Number(currentRaw) : 0
    const nextCount = current + 1

    await c.env.KV.put(key, String(nextCount), { expirationTtl: windowSeconds + 5 })

    if (nextCount > config.rateLimit.maxRequests) {
      throw new ApiError({ status: 429, code: 'RATE_LIMITED', message: 'Too many requests' })
    }

    await next()
  })
}
