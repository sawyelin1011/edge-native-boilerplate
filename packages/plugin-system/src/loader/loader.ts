// GSMFlow Plugin Loader
// Safe plugin loading with isolation

import type {
  Plugin,
  PluginLoader,
  PluginInstance,
  PluginStatus,
  PluginManifest,
  PluginSandbox,
} from './plugin'

// ============================================================================
// Plugin Loader Implementation
// ============================================================================

export class PluginLoaderImpl implements PluginLoader {
  private plugins: Map<string, PluginInstance> = new Map()
  private sandboxes: Map<string, PluginSandbox> = new Map()
  private manifestCache: Map<string, PluginManifest> = new Map()

  async load(id: string): Promise<Plugin> {
    const instance = this.plugins.get(id)
    if (instance) {
      return instance.plugin
    }

    // Load manifest
    const manifest = await this.loadManifest(id)
    
    // Create sandbox
    const sandbox = this.createSandbox(id, manifest.permissions)
    this.sandboxes.set(id, sandbox)

    // Load plugin code
    const plugin = await this.loadPluginCode(id, manifest, sandbox)
    
    // Initialize plugin
    await plugin.initialize.onLoad()
    
    // Register instance
    const pluginInstance: PluginInstance = {
      plugin,
      status: 'loaded',
      loadTime: new Date(),
    }
    this.plugins.set(id, pluginInstance)
    this.manifestCache.set(id, manifest)

    return plugin
  }

  async unload(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      return
    }

    // Unload plugin
    await instance.plugin.initialize.onUnload()
    
    // Clean up
    this.plugins.delete(id)
    this.sandboxes.delete(id)
    this.manifestCache.delete(id)
  }

  async enable(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      throw new Error(`Plugin ${id} not found`)
    }

    await instance.plugin.initialize.onEnable()
    instance.status = 'enabled'
  }

  async disable(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      throw new Error(`Plugin ${id} not found`)
    }

    await instance.plugin.initialize.onDisable()
    instance.status = 'disabled'
  }

  async reload(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      throw new Error(`Plugin ${id} not found`)
    }

    instance.status = 'updating'
    
    await instance.plugin.initialize.onUnload()
    await instance.plugin.initialize.onLoad()
    
    instance.status = 'loaded'
  }

  async getPlugin(id: string): Promise<PluginInstance | null> {
    return this.plugins.get(id) || null
  }

  async getPluginsByStatus(status: PluginStatus): Promise<ReadonlyArray<PluginInstance>> {
    const result: PluginInstance[] = []
    for (const instance of this.plugins.values()) {
      if (instance.status === status) {
        result.push(instance)
      }
    }
    return result
  }

  async getLoadedPlugins(): Promise<ReadonlyArray<PluginInstance>> {
    return Array.from(this.plugins.values())
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private async loadManifest(id: string): Promise<PluginManifest> {
    // Check cache
    const cached = this.manifestCache.get(id)
    if (cached) {
      return cached
    }

    // Load manifest from registry/storage
    // For now, return a placeholder
    const manifest: PluginManifest = {
      id,
      name: id,
      version: '1.0.0',
      description: 'Loaded plugin',
      author: 'Unknown',
      permissions: [],
      hooks: [],
      engines: {
        gsmflow: '>=1.0.0',
      },
    }

    this.manifestCache.set(id, manifest)
    return manifest
  }

  private createSandbox(pluginId: string, permissions: Array<{ id: string }>): PluginSandbox {
    return {
      pluginId,
      permissions: permissions.map(p => p.id),
      allowedImports: new Set<string>(),
      deniedImports: new Set<string>(),
      allowedHosts: new Set<string>(),
      deniedHosts: new Set<string>(),
    }
  }

  private async loadPluginCode(id: string, manifest: PluginManifest, sandbox: PluginSandbox): Promise<Plugin> {
    // Placeholder: Create a basic plugin from manifest
    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      initialize: {
        onLoad: async () => {},
        onUnload: async () => {},
        onEnable: async () => {},
        onDisable: async () => {},
        onUpdate: async () => {},
      },
      hooks: {},
      permissions: manifest.permissions,
      dependencies: manifest.dependencies ? Object.entries(manifest.dependencies).map(([id, version]) => ({
        id,
        versionRange: version,
      })) : [],
    }
  }
}

// ============================================================================
// Plugin Sandbox Implementation
// ============================================================================

class PluginSandboxImpl implements PluginSandbox {
  readonly pluginId: string
  readonly permissions: ReadonlyArray<string>
  readonly allowedImports: Set<string>
  readonly deniedImports: Set<string>
  readonly allowedHosts: Set<string>
  readonly deniedHosts: Set<string>

  constructor(pluginId: string, permissions: ReadonlyArray<string>) {
    this.pluginId = pluginId
    this.permissions = permissions
    this.allowedImports = new Set()
    this.deniedImports = new Set()
    this.allowedHosts = new Set()
    this.deniedHosts = new Set()
  }

  allowImport(modulePath: string): void {
    this.allowedImports.add(modulePath)
    this.deniedImports.delete(modulePath)
  }

  denyImport(modulePath: string): void {
    this.deniedImports.add(modulePath)
    this.allowedImports.delete(modulePath)
  }

  allowNetwork(host: string): void {
    this.allowedHosts.add(host)
    this.deniedHosts.delete(host)
  }

  denyNetwork(host: string): void {
    this.deniedHosts.add(host)
    this.allowedHosts.delete(host)
  }

  async execute<T>(code: string, context: Record<string, unknown>): Promise<T> {
    // Security: Never execute untrusted code in production
    // This is a placeholder for sandboxed execution
    throw new Error('Plugin execution not enabled in Phase 1')
  }

  async executeFunction<T>(fn: Function, args: unknown[]): Promise<T> {
    throw new Error('Plugin execution not enabled in Phase 1')
  }
}

// ============================================================================
// Default Loader Factory
// ============================================================================

export function createPluginLoader(): PluginLoader {
  return new PluginLoaderImpl()
}

function createSandbox(pluginId: string, permissions: Array<{ id: string }>): PluginSandbox {
  return new PluginSandboxImpl(pluginId, permissions)
}
