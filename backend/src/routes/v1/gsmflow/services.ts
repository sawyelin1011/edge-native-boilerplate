import { Hono } from 'hono'

import type { Bindings, Variables } from '../../../index'
import { ok } from '../../../lib/http/response'
import { listActiveServices } from '../../../db/repositories/services'
import { calculateRolePrice } from '../../../gsmflow/pricing'
import { optionalAuthMiddleware } from '../../../middleware/auth'

const servicesRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

servicesRoute.get('/', optionalAuthMiddleware, async (c) => {
  const role = c.get('user')?.role ?? 'USER'
  const items = await listActiveServices(c.get('db'))

  const priced = items.map((s) => ({
    id: s.id,
    providerId: s.providerId,
    serviceType: s.serviceType,
    name: s.name,
    description: s.description,
    category: s.category,
    currency: s.currency,
    apiPrice: s.apiPrice,
    price: calculateRolePrice({ apiPrice: s.basePrice, role }),
    isActive: s.isActive
  }))

  return c.json(ok({ requestId: c.get('requestId'), data: priced, meta: { total: priced.length } }))
})

servicesRoute.get('/categories', optionalAuthMiddleware, async (c) => {
  const items = await listActiveServices(c.get('db'))
  const categories = Array.from(new Set(items.map((s) => s.category).filter((v): v is string => Boolean(v))))
  return c.json(ok({ requestId: c.get('requestId'), data: categories }))
})

export { servicesRoute as gsmflowServicesRoutesV1 }
