import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings, Variables } from '../../../index'
import { ok } from '../../../lib/http/response'
import { parseJson } from '../../../lib/validation'
import { authMiddleware, requirePermission } from '../../../middleware/auth'
import { csrfMiddleware } from '../../../middleware/csrf'
import { listOrdersByUser, getOrderById } from '../../../db/repositories/orders'
import { createPendingOrder, placeOrderWithProvider, refreshOrderStatus } from '../../../gsmflow/orders'
import { createApiError } from '../../../lib/http/errors'

const ordersRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CreateOrderSchema = z.object({
  serviceId: z.string().uuid(),
  payload: z.record(z.unknown()).default({})
})

ordersRoute.get('/', authMiddleware, requirePermission('orders:read'), async (c) => {
  const user = c.get('user')
  if (!user) {
    throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }

  const list = await listOrdersByUser(c.get('db'), user.id)
  return c.json(ok({ requestId: c.get('requestId'), data: list, meta: { total: list.length } }))
})

ordersRoute.post('/', authMiddleware, requirePermission('orders:write'), csrfMiddleware, async (c) => {
  const user = c.get('user')
  if (!user) {
    throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }

  const body = await parseJson(c, CreateOrderSchema)

  const order = await createPendingOrder(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config: c.get('config')
    },
    { userId: user.id, serviceId: body.serviceId, payload: body.payload }
  )

  return c.json(ok({ requestId: c.get('requestId'), data: order }), 201)
})

ordersRoute.post('/:id/place', authMiddleware, requirePermission('orders:write'), csrfMiddleware, async (c) => {
  const user = c.get('user')
  if (!user) {
    throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }

  const orderId = c.req.param('id')

  const existing = await getOrderById(c.get('db'), orderId)
  if (!existing || existing.userId !== user.id) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  }

  const updated = await placeOrderWithProvider(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config: c.get('config')
    },
    { orderId }
  )

  return c.json(ok({ requestId: c.get('requestId'), data: updated }))
})

ordersRoute.get('/:id/status', authMiddleware, requirePermission('orders:read'), async (c) => {
  const user = c.get('user')
  if (!user) {
    throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }

  const orderId = c.req.param('id')

  const existing = await getOrderById(c.get('db'), orderId)
  if (!existing || existing.userId !== user.id) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  }

  const refreshed = await refreshOrderStatus(
    {
      db: c.get('db'),
      kv: c.env.KV,
      config: c.get('config')
    },
    { orderId }
  )

  return c.json(ok({ requestId: c.get('requestId'), data: refreshed }))
})

ordersRoute.post('/:id/public-status', async (c) => {
  const orderId = c.req.param('id')
  const order = await getOrderById(c.get('db'), orderId)

  if (!order) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  }

  return c.json(
    ok({
      requestId: c.get('requestId'),
      data: {
        id: order.id,
        status: order.status,
        result: order.status === 'COMPLETED' ? order.result : null
      }
    })
  )
})

export { ordersRoute as gsmflowOrdersRoutesV1 }
