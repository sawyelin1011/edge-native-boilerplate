import { and, eq } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { plugins } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export async function listActivePlugins(db: DbExecutor, type?: string) {
  if (!type) {
    return db.select().from(plugins).where(eq(plugins.isActive, true)).all()
  }

  return db
    .select()
    .from(plugins)
    .where(and(eq(plugins.isActive, true), eq(plugins.type, type)))
    .all()
}

export async function getPluginByName(db: DbExecutor, name: string) {
  return db.select().from(plugins).where(eq(plugins.name, name)).get()
}

export async function upsertPlugin(
  db: DbExecutor,
  params: { name: string; type: string; version: string; config: string | null; isActive: boolean }
) {
  const now = nowIso()
  const existing = await getPluginByName(db, params.name)
  if (!existing) {
    const [plugin] = await db
      .insert(plugins)
      .values({
        name: params.name,
        type: params.type,
        version: params.version,
        config: params.config,
        isActive: params.isActive,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return plugin
  }

  const [plugin] = await db
    .update(plugins)
    .set({
      type: params.type,
      version: params.version,
      config: params.config,
      isActive: params.isActive,
      updatedAt: now
    })
    .where(eq(plugins.id, existing.id))
    .returning()

  return plugin
}
