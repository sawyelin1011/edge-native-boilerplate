import type { Role } from 'shared'

import type { PluginContext } from '../plugins/types'
import { createApiError } from '../lib/http/errors'
import { calculateRolePrice } from './pricing'
import { findUserById, addUserBalance } from '../db/repositories/users'
import { getServiceById } from '../db/repositories/services'
import { getProviderById } from '../db/repositories/serviceProviders'
import { createOrder, getOrderById, markOrderRefunded, setOrderExternalId, setOrderResult, setOrderStatus, type OrderStatus } from '../db/repositories/orders'
import { getProviderClient, asServiceType } from './providers'

function assertRole(role: string): Role {
  const normalized = role.toUpperCase()
  if (normalized === 'ADMIN') return 'ADMIN'
  if (normalized === 'WEB_OWNER') return 'WEB_OWNER'
  if (normalized === 'DISTRIBUTOR') return 'DISTRIBUTOR'
  if (normalized === 'RESELLER') return 'RESELLER'
  return 'USER'
}

export async function createPendingOrder(ctx: PluginContext, params: { userId: string; serviceId: string; payload: Record<string, unknown> }) {
  const user = await findUserById(ctx.db, params.userId)
  if (!user) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'User not found' })
  }

  const service = await getServiceById(ctx.db, params.serviceId)
  if (!service || !service.isActive || service.deletedAt) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Service not found' })
  }

  const role = assertRole(user.role)
  const price = calculateRolePrice({ apiPrice: service.basePrice, role })

  if (user.balance < price) {
    throw createApiError({ status: 409, code: 'CONFLICT', message: 'Insufficient balance' })
  }

  const payloadJson = JSON.stringify(params.payload)

  const order = await ctx.db.transaction(async (tx) => {
    const nextBalance = await addUserBalance(tx, { userId: user.id, amount: -price })
    if (nextBalance === null) {
      throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'User not found' })
    }

    return createOrder(tx, {
      userId: user.id,
      serviceId: service.id,
      providerId: service.providerId,
      status: 'PENDING',
      price,
      apiPrice: service.apiPrice,
      currency: service.currency,
      payload: payloadJson
    })
  })

  return order
}

export async function placeOrderWithProvider(ctx: PluginContext, params: { orderId: string }) {
  const order = await getOrderById(ctx.db, params.orderId)
  if (!order) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  }

  if (order.status !== 'PENDING') {
    return order
  }

  const service = await getServiceById(ctx.db, order.serviceId)
  if (!service) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Service not found' })
  }

  const provider = await getProviderById(ctx.db, order.providerId)
  if (!provider) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Provider not found' })
  }

  const payload = order.payload ? (JSON.parse(order.payload) as Record<string, unknown>) : {}
  const client = await getProviderClient({
    ctx,
    provider: {
      id: provider.id,
      type: provider.type,
      adapterType: provider.adapterType,
      apiUrl: provider.apiUrl,
      credentialsEncrypted: provider.credentialsEncrypted
    }
  })

  try {
    await setOrderStatus(ctx.db, { orderId: order.id, status: 'PROCESSING' })

    const placed = await client.placeOrder({
      serviceType: asServiceType(service.serviceType),
      externalServiceId: service.externalServiceId,
      payload
    })

    await setOrderExternalId(ctx.db, { orderId: order.id, externalOrderId: placed.externalOrderId })

    return getOrderById(ctx.db, order.id)
  } catch (err) {
    await setOrderStatus(ctx.db, { orderId: order.id, status: 'FAILED', failureReason: (err as Error).message })
    await refundIfNeeded(ctx, { orderId: order.id })
    return getOrderById(ctx.db, order.id)
  }
}

export async function refreshOrderStatus(ctx: PluginContext, params: { orderId: string }) {
  const order = await getOrderById(ctx.db, params.orderId)
  if (!order) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  }

  if (!order.externalOrderId) return order
  if (order.status !== 'PROCESSING') return order

  const service = await getServiceById(ctx.db, order.serviceId)
  if (!service) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Service not found' })
  }

  const provider = await getProviderById(ctx.db, order.providerId)
  if (!provider) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Provider not found' })
  }

  const client = await getProviderClient({
    ctx,
    provider: {
      id: provider.id,
      type: provider.type,
      adapterType: provider.adapterType,
      apiUrl: provider.apiUrl,
      credentialsEncrypted: provider.credentialsEncrypted
    }
  })

  const status = await client.checkStatus({ serviceType: asServiceType(service.serviceType), externalOrderId: order.externalOrderId })

  if (status.status === 'COMPLETED') {
    await setOrderStatus(ctx.db, { orderId: order.id, status: 'COMPLETED' })
    if (status.result) {
      await setOrderResult(ctx.db, { orderId: order.id, result: status.result })
    }
  }

  if (status.status === 'FAILED') {
    await setOrderStatus(ctx.db, { orderId: order.id, status: 'FAILED', failureReason: status.result ?? 'Provider failed' })
    await refundIfNeeded(ctx, { orderId: order.id })
  }

  return getOrderById(ctx.db, order.id)
}

export async function cancelOrder(ctx: PluginContext, params: { orderId: string }) {
  const order = await getOrderById(ctx.db, params.orderId)
  if (!order) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  }

  if (order.status === 'COMPLETED') {
    throw createApiError({ status: 409, code: 'CONFLICT', message: 'Cannot cancel a completed order' })
  }

  await setOrderStatus(ctx.db, { orderId: order.id, status: 'CANCELLED' })
  await refundIfNeeded(ctx, { orderId: order.id })
  return getOrderById(ctx.db, order.id)
}

async function refundIfNeeded(ctx: PluginContext, params: { orderId: string }) {
  const order = await getOrderById(ctx.db, params.orderId)
  if (!order) return
  if (order.refundedAt) return

  const refundable: OrderStatus[] = ['FAILED', 'CANCELLED']
  if (!refundable.includes(order.status as OrderStatus)) return

  await ctx.db.transaction(async (tx) => {
    await addUserBalance(tx, { userId: order.userId, amount: order.price })
    await markOrderRefunded(tx, { orderId: order.id })
  })
}
