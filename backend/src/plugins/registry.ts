import { createPluginManager } from './manager'
import type { PluginManager } from './types'
import { nowPaymentsPlugin } from './payment/nowpayments'
import { dhruProviderPlugin } from './provider/dhru'

let cached: PluginManager | null = null

export function getPluginManager(): PluginManager {
  if (cached) return cached
  const manager = createPluginManager()

  manager.register(nowPaymentsPlugin)
  manager.register(dhruProviderPlugin)

  cached = manager
  return manager
}
