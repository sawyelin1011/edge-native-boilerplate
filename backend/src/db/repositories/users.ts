import { and, eq, isNull } from 'drizzle-orm'
import type { Database } from '../client'
import { users } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

const userPublicColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  deletedAt: users.deletedAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt
}

const userAuthColumns = {
  ...userPublicColumns,
  passwordHash: users.passwordHash
}

export async function findUserByEmail(db: Database, email: string) {
  return db
    .select(userPublicColumns)
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .get()
}

export async function findUserForLoginByEmail(db: Database, email: string) {
  return db
    .select(userAuthColumns)
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .get()
}

export async function findUserById(db: Database, id: string) {
  return db
    .select(userPublicColumns)
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .get()
}

export async function listUsers(db: Database) {
  return db.select(userPublicColumns).from(users).where(isNull(users.deletedAt)).all()
}

export async function createUser(db: Database, params: { email: string; name: string; role: string; passwordHash: string }) {
  const [user] = await db
    .insert(users)
    .values({
      email: params.email,
      name: params.name,
      role: params.role,
      passwordHash: params.passwordHash,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
    .returning(userPublicColumns)

  return user
}

export async function updateUserLastLogin(db: Database, userId: string) {
  await db
    .update(users)
    .set({
      updatedAt: nowIso()
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .run()
}

export async function softDeleteUser(db: Database, userId: string) {
  await db
    .update(users)
    .set({
      deletedAt: nowIso(),
      updatedAt: nowIso()
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .run()
}
