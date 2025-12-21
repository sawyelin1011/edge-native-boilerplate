import { and, desc, eq, isNull } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { serviceProviders } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export async function listActiveProviders(db: DbExecutor) {
  return db
    .select()
    .from(serviceProviders)
    .where(and(eq(serviceProviders.isActive, true), isNull(serviceProviders.deletedAt)))
    .orderBy(desc(serviceProviders.priority))
    .all()
}

export async function getProviderById(db: DbExecutor, id: string) {
  return db
    .select()
    .from(serviceProviders)
    .where(and(eq(serviceProviders.id, id), isNull(serviceProviders.deletedAt)))
    .get()
}

export async function createProvider(
  db: DbExecutor,
  params: {
    name: string
    type: string
    adapterType: string
    apiUrl: string
    credentialsEncrypted: string | null
    configuration: string | null
    priority: number
  }
) {
  const [provider] = await db
    .insert(serviceProviders)
    .values({
      name: params.name,
      type: params.type,
      adapterType: params.adapterType,
      apiUrl: params.apiUrl,
      credentialsEncrypted: params.credentialsEncrypted,
      configuration: params.configuration,
      priority: params.priority,
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
    .returning()

  return provider
}

export async function updateProviderLastSync(db: DbExecutor, id: string) {
  await db
    .update(serviceProviders)
    .set({ updatedAt: nowIso() })
    .where(and(eq(serviceProviders.id, id), isNull(serviceProviders.deletedAt)))
    .run()
}
