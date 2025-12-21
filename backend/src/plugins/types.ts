import type { Database } from '../db/client'
import type { AppConfig } from '../config'

export type PluginType = 'payment' | 'cms' | 'auth' | 'provider'

export type PluginContext = {
  db: Database
  kv: KVNamespace
  config: AppConfig
}

export type PluginDefinition<TConfig, TInstance> = {
  name: string
  type: PluginType
  version: string
  validateConfig: (raw: unknown) => TConfig
  create: (ctx: PluginContext, config: TConfig) => Promise<TInstance>
}

export type PluginManager = {
  register: <TConfig, TInstance>(plugin: PluginDefinition<TConfig, TInstance>) => void
  get: <TConfig, TInstance>(name: string) => PluginDefinition<TConfig, TInstance> | null
  list: (type?: PluginType) => PluginDefinition<unknown, unknown>[]
}
