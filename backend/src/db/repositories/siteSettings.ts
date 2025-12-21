import { eq } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { siteSettings } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export async function getSetting(db: DbExecutor, key: string) {
  return db.select().from(siteSettings).where(eq(siteSettings.key, key)).get()
}

export async function listSettings(db: DbExecutor) {
  return db.select().from(siteSettings).all()
}

export async function setSetting(db: DbExecutor, params: { key: string; value: string }) {
  const existing = await getSetting(db, params.key)
  const now = nowIso()

  if (!existing) {
    const [created] = await db
      .insert(siteSettings)
      .values({
        key: params.key,
        value: params.value,
        updatedAt: now
      })
      .returning()

    return created
  }

  const [updated] = await db
    .update(siteSettings)
    .set({ value: params.value, updatedAt: now })
    .where(eq(siteSettings.key, params.key))
    .returning()

  return updated
}
