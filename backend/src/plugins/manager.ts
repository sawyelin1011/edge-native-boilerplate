import type { PluginDefinition, PluginManager, PluginType } from './types'

export function createPluginManager(): PluginManager {
  const registry = new Map<string, PluginDefinition<unknown, unknown>>()

  function register<TConfig, TInstance>(plugin: PluginDefinition<TConfig, TInstance>) {
    registry.set(plugin.name, plugin as unknown as PluginDefinition<unknown, unknown>)
  }

  function get<TConfig, TInstance>(name: string) {
    return (registry.get(name) as unknown as PluginDefinition<TConfig, TInstance> | undefined) ?? null
  }

  function list(type?: PluginType) {
    const all = Array.from(registry.values())
    if (!type) return all
    return all.filter((p) => p.type === type)
  }

  return { register, get, list }
}
