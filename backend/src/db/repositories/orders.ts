import { and, desc, eq, isNull } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { orders } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export async function getOrderById(db: DbExecutor, id: string) {
  return db.select().from(orders).where(eq(orders.id, id)).get()
}

export async function listOrdersByUser(db: DbExecutor, userId: string) {
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).all()
}

export async function createOrder(
  db: DbExecutor,
  params: {
    userId: string
    serviceId: string
    providerId: string
    status: OrderStatus
    price: number
    apiPrice: number
    currency: string
    payload: string
  }
) {
  const now = nowIso()
  const [order] = await db
    .insert(orders)
    .values({
      userId: params.userId,
      serviceId: params.serviceId,
      providerId: params.providerId,
      status: params.status,
      price: params.price,
      apiPrice: params.apiPrice,
      currency: params.currency,
      payload: params.payload,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return order
}

export async function setOrderExternalId(db: DbExecutor, params: { orderId: string; externalOrderId: string }) {
  await db
    .update(orders)
    .set({ externalOrderId: params.externalOrderId, updatedAt: nowIso() })
    .where(eq(orders.id, params.orderId))
    .run()
}

export async function setOrderStatus(db: DbExecutor, params: { orderId: string; status: OrderStatus; failureReason?: string }) {
  await db
    .update(orders)
    .set({
      status: params.status,
      failureReason: params.failureReason ?? null,
      updatedAt: nowIso()
    })
    .where(eq(orders.id, params.orderId))
    .run()
}

export async function setOrderResult(db: DbExecutor, params: { orderId: string; result: string }) {
  await db
    .update(orders)
    .set({ result: params.result, updatedAt: nowIso() })
    .where(eq(orders.id, params.orderId))
    .run()
}

export async function markOrderRefunded(db: DbExecutor, params: { orderId: string }) {
  await db
    .update(orders)
    .set({ refundedAt: nowIso(), updatedAt: nowIso() })
    .where(and(eq(orders.id, params.orderId), isNull(orders.refundedAt)))
    .run()
}
