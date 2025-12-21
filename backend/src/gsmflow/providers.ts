import { createPluginInstance } from './pluginRuntime'
import { decryptString } from './encryption'
import type { PluginContext } from '../plugins/types'
import type { DhruProviderClient, ServiceType } from '../plugins/provider/dhru'
import { createApiError } from '../lib/http/errors'

export type ProviderClient = DhruProviderClient

export async function getProviderClient(params: {
  ctx: PluginContext
  provider: {
    id: string
    type: string
    adapterType: string
    apiUrl: string
    credentialsEncrypted: string | null
  }
}): Promise<ProviderClient> {
  const adapter = params.provider.adapterType || params.provider.type

  if (adapter !== 'dhru') {
    throw createApiError({ status: 400, code: 'VALIDATION_ERROR', message: `Unsupported provider adapter: ${adapter}` })
  }

  if (!params.provider.credentialsEncrypted) {
    throw createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Provider credentials are missing' })
  }

  const decrypted = await decryptString({ encrypted: params.provider.credentialsEncrypted, secret: params.ctx.config.gsmflow.encryptionKey })
  const credentials = JSON.parse(decrypted) as { username: string; apiKey: string }

  const client = await createPluginInstance<DhruProviderClient>({
    ctx: params.ctx,
    name: 'dhru'
  })

  // Override with per-provider URL/credentials
  return {
    ...client,
    syncServices: () =>
      createPluginInstance<DhruProviderClient>({
        ctx: {
          ...params.ctx,
          config: {
            ...params.ctx.config,
            gsmflow: {
              ...params.ctx.config.gsmflow,
              providers: {
                ...params.ctx.config.gsmflow.providers,
                dhru: {
                  apiBaseUrl: params.provider.apiUrl,
                  username: credentials.username,
                  apiKey: credentials.apiKey
                }
              }
            }
          }
        },
        name: 'dhru'
      }).then((c) => c.syncServices()),
    placeOrder: (p) =>
      createPluginInstance<DhruProviderClient>({
        ctx: {
          ...params.ctx,
          config: {
            ...params.ctx.config,
            gsmflow: {
              ...params.ctx.config.gsmflow,
              providers: {
                ...params.ctx.config.gsmflow.providers,
                dhru: {
                  apiBaseUrl: params.provider.apiUrl,
                  username: credentials.username,
                  apiKey: credentials.apiKey
                }
              }
            }
          }
        },
        name: 'dhru'
      }).then((c) => c.placeOrder(p)),
    checkStatus: (p) =>
      createPluginInstance<DhruProviderClient>({
        ctx: {
          ...params.ctx,
          config: {
            ...params.ctx.config,
            gsmflow: {
              ...params.ctx.config.gsmflow,
              providers: {
                ...params.ctx.config.gsmflow.providers,
                dhru: {
                  apiBaseUrl: params.provider.apiUrl,
                  username: credentials.username,
                  apiKey: credentials.apiKey
                }
              }
            }
          }
        },
        name: 'dhru'
      }).then((c) => c.checkStatus(p))
  }
}

export function asServiceType(input: string): ServiceType {
  const t = input.toUpperCase()
  if (t === 'IMEI') return 'IMEI'
  if (t === 'SERVER') return 'SERVER'
  if (t === 'FILE') return 'FILE'
  if (t === 'REMOTE') return 'REMOTE'
  return 'IMEI'
}
