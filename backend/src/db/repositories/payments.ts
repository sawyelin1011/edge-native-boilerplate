import { desc, eq } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { payments } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED'

export async function createPayment(
  db: DbExecutor,
  params: {
    userId: string
    gateway: string
    status: PaymentStatus
    amount: number
    currency: string
    externalId: string | null
    checkoutUrl: string | null
    raw: string | null
  }
) {
  const now = nowIso()
  const [payment] = await db
    .insert(payments)
    .values({
      userId: params.userId,
      gateway: params.gateway,
      status: params.status,
      amount: params.amount,
      currency: params.currency,
      externalId: params.externalId,
      checkoutUrl: params.checkoutUrl,
      raw: params.raw,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return payment
}

export async function updatePaymentStatus(db: DbExecutor, params: { id: string; status: PaymentStatus; raw?: string | null }) {
  await db
    .update(payments)
    .set({ status: params.status, raw: params.raw ?? undefined, updatedAt: nowIso() })
    .where(eq(payments.id, params.id))
    .run()
}

export async function setPaymentExternal(db: DbExecutor, params: { id: string; externalId: string; checkoutUrl: string; raw?: string | null }) {
  await db
    .update(payments)
    .set({ externalId: params.externalId, checkoutUrl: params.checkoutUrl, raw: params.raw ?? undefined, updatedAt: nowIso() })
    .where(eq(payments.id, params.id))
    .run()
}

export async function getPaymentById(db: DbExecutor, id: string) {
  return db.select().from(payments).where(eq(payments.id, id)).get()
}

export async function getPaymentByExternalId(db: DbExecutor, externalId: string) {
  return db.select().from(payments).where(eq(payments.externalId, externalId)).get()
}

export async function listPaymentsByUser(db: DbExecutor, userId: string) {
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).all()
}
