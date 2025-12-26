// GSMFlow Plugin System Core
// Foundation for extensible plugin architecture

import type { RequestContext, DomainEvent } from '@gsmflow/core'

// ============================================================================
// Plugin Types
// ============================================================================

export interface Plugin {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  
  // Lifecycle
  readonly initialize: PluginLifecycle
  readonly hooks: PluginHooks
  readonly permissions: PluginPermission[]
  readonly dependencies?: PluginDependency[]
}

export interface PluginLifecycle {
  onLoad(): Promise<void>
  onUnload(): Promise<void>
  onEnable(): Promise<void>
  onDisable(): Promise<void>
  onUpdate(newVersion: string): Promise<void>
}

export interface PluginHooks {
  [hookName: string]: PluginHookHandler
}

export type PluginHookHandler = (
  data: unknown,
  context: PluginHookContext
) => Promise<PluginHookResult>

export interface PluginHookContext {
  readonly pluginId: string
  readonly requestContext: RequestContext
}

export interface PluginHookResult {
  readonly modified: boolean
  readonly data?: unknown
  readonly error?: string
}

export interface PluginPermission {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly required: boolean
}

export interface PluginDependency {
  readonly id: string
  readonly versionRange: string // semver range
}

// ============================================================================
// Plugin Status
// ============================================================================

export type PluginStatus =
  | 'loading'
  | 'loaded'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'updating'

export interface PluginInstance {
  readonly plugin: Plugin
  readonly status: PluginStatus
  readonly error?: Error
  readonly loadTime: Date
}

// ============================================================================
// Plugin Loader
// ============================================================================

export interface PluginLoader {
  load(id: string): Promise<Plugin>
  unload(id: string): Promise<void>
  enable(id: string): Promise<void>
  disable(id: string): Promise<void>
  reload(id: string): Promise<void>
  getPlugin(id: string): Promise<PluginInstance | null>
  getPluginsByStatus(status: PluginStatus): Promise<ReadonlyArray<PluginInstance>>
  getLoadedPlugins(): Promise<ReadonlyArray<PluginInstance>>
}

// ============================================================================
// Plugin Registry
// ============================================================================

export interface PluginRegistry {
  register(plugin: Plugin): void
  unregister(pluginId: string): void
  get(pluginId: string): Plugin | null
  getAll(): ReadonlyArray<Plugin>
  findByName(name: string): Plugin | null
  findByAuthor(author: string): ReadonlyArray<Plugin>
}

// ============================================================================
// Plugin Manager (orchestrates loaders and registry)
// ============================================================================

export interface PluginManager {
  readonly registry: PluginRegistry
  readonly loader: PluginLoader
  
  // Install/uninstall
  install(source: string | Uint8Array): Promise<Plugin>
  uninstall(pluginId: string): Promise<void>
  
  // Lifecycle
  load(pluginId: string): Promise<void>
  unload(pluginId: string): Promise<void>
  enable(pluginId: string): Promise<void>
  disable(pluginId: string): Promise<void>
  
  // Hook execution
  executeHook<T>(
    hookName: string,
    data: T,
    context: RequestContext
  ): Promise<Array<PluginHookResult>>
  
  // Status
  getStatus(pluginId: string): Promise<PluginStatus>
  getAllStatuses(): Promise<ReadonlyArray<{ id: string; status: PluginStatus; error?: string }>>
}

// ============================================================================
// Plugin Sandbox (for secure execution)
// ============================================================================

export interface PluginSandbox {
  readonly pluginId: string
  readonly permissions: ReadonlyArray<string>
  
  // Allow/Deny
  allowImport(modulePath: string): void
  denyImport(modulePath: string): void
  allowNetwork(host: string): void
  denyNetwork(host: string): void
  
  // Execution
  execute<T>(code: string, context: Record<string, unknown>): Promise<T>
  executeFunction<T>(fn: Function, args: unknown[]): Promise<T>
}

// ============================================================================
// Plugin Events
// ============================================================================

export type PluginEventType =
  | 'plugin.loaded'
  | 'plugin.unloaded'
  | 'plugin.enabled'
  | 'plugin.disabled'
  | 'plugin.error'
  | 'hook.executed'
  | 'hook.error'

export interface PluginEvent {
  readonly type: PluginEventType
  readonly pluginId: string
  readonly timestamp: Date
  readonly payload: Record<string, unknown>
}

// ============================================================================
// Plugin Manifest (package.json equivalent)
// ============================================================================

export interface PluginManifest {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly license?: string
  readonly main?: string
  readonly entry?: string
  readonly permissions: ReadonlyArray<PluginPermission>
  readonly hooks: ReadonlyArray<string>
  readonly dependencies?: Record<string, string>
  readonly engines?: {
    readonly gsmflow: string // semver range
    readonly node?: string
  }
}

// ============================================================================
// Default Plugins (Foundation Only)
// ============================================================================

export const corePlugin: Plugin = {
  id: '@gsmflow/core',
  name: 'GSMFlow Core',
  version: '1.0.0',
  description: 'Core plugin with essential functionality',
  author: 'GSMFlow Team',
  initialize: {
    onLoad: async () => {},
    onUnload: async () => {},
    onEnable: async () => {},
    onDisable: async () => {},
    onUpdate: async () => {},
  },
  hooks: {
    'request.start': async (data, ctx) => ({ modified: false, data }),
    'request.end': async (data, ctx) => ({ modified: false, data }),
    'auth.check': async (data, ctx) => ({ modified: false, data }),
  },
  permissions: [
    { id: 'core:basic', name: 'Basic Access', description: 'Access to core features', required: true },
  ],
}
