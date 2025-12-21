import { and, eq, isNull } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { services } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export async function listActiveServices(db: DbExecutor) {
  return db
    .select()
    .from(services)
    .where(and(eq(services.isActive, true), isNull(services.deletedAt)))
    .all()
}

export async function getServiceById(db: DbExecutor, id: string) {
  return db.select().from(services).where(and(eq(services.id, id), isNull(services.deletedAt))).get()
}

export async function upsertService(
  db: DbExecutor,
  params: {
    providerId: string
    externalServiceId: string
    serviceType: string
    name: string
    description: string | null
    apiPrice: number
    basePrice: number
    currency: string
    category: string | null
    isActive: boolean
  }
) {
  const now = nowIso()

  const [service] = await db
    .insert(services)
    .values({
      providerId: params.providerId,
      externalServiceId: params.externalServiceId,
      serviceType: params.serviceType,
      name: params.name,
      description: params.description,
      apiPrice: params.apiPrice,
      basePrice: params.basePrice,
      currency: params.currency,
      category: params.category,
      isActive: params.isActive,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [services.providerId, services.externalServiceId],
      set: {
        serviceType: params.serviceType,
        name: params.name,
        description: params.description,
        apiPrice: params.apiPrice,
        basePrice: params.basePrice,
        currency: params.currency,
        category: params.category,
        isActive: params.isActive,
        updatedAt: now
      }
    })
    .returning()

  return service
}
