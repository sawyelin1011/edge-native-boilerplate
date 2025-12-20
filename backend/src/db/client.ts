import { drizzle } from 'drizzle-orm/d1'
import type { ExtractTablesWithRelations } from 'drizzle-orm/relations'
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core'

import * as schema from '../lib/schema'

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Database = ReturnType<typeof createDb>

export type DbTransaction = SQLiteTransaction<'async', D1Result<unknown>, typeof schema, ExtractTablesWithRelations<typeof schema>>

export type DbExecutor = Database | DbTransaction
