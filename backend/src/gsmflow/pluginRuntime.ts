import { getPluginByName } from '../db/repositories/plugins'
import { getPluginManager } from '../plugins/registry'
import type { PluginContext } from '../plugins/types'

export async function createPluginInstance<TInstance>(params: {
  ctx: PluginContext
  name: string
}): Promise<TInstance> {
  const def = getPluginManager().get<unknown, TInstance>(params.name)
  if (!def) {
    throw new Error(`Plugin not registered: ${params.name}`)
  }

  const record = await getPluginByName(params.ctx.db, params.name)

  let rawConfig: unknown = null
  if (record) {
    if (!record.isActive) {
      throw new Error(`Plugin is disabled: ${params.name}`)
    }

    rawConfig = record.config ? (JSON.parse(record.config) as unknown) : null
  } else {
    // Env fallback for dev/bootstrap
    if (params.name === 'nowpayments') {
      rawConfig = params.ctx.config.gsmflow.payments.nowpayments
    }

    if (params.name === 'dhru') {
      rawConfig = params.ctx.config.gsmflow.providers.dhru
    }
  }

  const config = def.validateConfig(rawConfig)
  return def.create(params.ctx, config)
}
