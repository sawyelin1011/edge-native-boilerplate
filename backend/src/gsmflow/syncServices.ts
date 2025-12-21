import type { PluginContext } from '../plugins/types'
import { listActiveProviders } from '../db/repositories/serviceProviders'
import { upsertService } from '../db/repositories/services'
import { getProviderClient } from './providers'

export async function syncAllProviderServices(ctx: PluginContext) {
  const providers = await listActiveProviders(ctx.db)
  const synced: { providerId: string; count: number }[] = []

  for (const provider of providers) {
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

    const items = await client.syncServices()

    for (const s of items) {
      await upsertService(ctx.db, {
        providerId: provider.id,
        externalServiceId: s.externalServiceId,
        serviceType: s.serviceType,
        name: s.name,
        description: s.description,
        apiPrice: s.apiPrice,
        basePrice: s.apiPrice,
        currency: s.currency,
        category: s.category,
        isActive: s.isActive
      })
    }

    synced.push({ providerId: provider.id, count: items.length })
  }

  return synced
}
