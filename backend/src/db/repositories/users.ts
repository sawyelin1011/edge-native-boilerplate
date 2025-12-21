import { and, eq, isNull } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { users } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

const userPublicColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  balance: users.balance,
  isEmailVerified: users.isEmailVerified,
  emailVerifiedAt: users.emailVerifiedAt,
  twoFactorEnabled: users.twoFactorEnabled,
  phone: users.phone,
  deletedAt: users.deletedAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt
}

const userAuthColumns = {
  ...userPublicColumns,
  passwordHash: users.passwordHash
}

export async function findUserByEmail(db: DbExecutor, email: string) {
  return db
    .select(userPublicColumns)
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .get()
}

export async function findUserForLoginByEmail(db: DbExecutor, email: string) {
  return db
    .select(userAuthColumns)
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .get()
}

export async function findUserById(db: DbExecutor, id: string) {
  return db
    .select(userPublicColumns)
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .get()
}

export async function listUsers(db: DbExecutor) {
  return db.select(userPublicColumns).from(users).where(isNull(users.deletedAt)).all()
}

export async function createUser(db: DbExecutor, params: { email: string; name: string; role: string; passwordHash: string }) {
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

export async function updateUserLastLogin(db: DbExecutor, userId: string) {
  await db
    .update(users)
    .set({
      updatedAt: nowIso()
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .run()
}

export async function softDeleteUser(db: DbExecutor, userId: string) {
  await db
    .update(users)
    .set({
      deletedAt: nowIso(),
      updatedAt: nowIso()
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .run()
}

export async function addUserBalance(db: DbExecutor, params: { userId: string; amount: number }) {
  const user = await db
    .select({ balance: users.balance })
    .from(users)
    .where(and(eq(users.id, params.userId), isNull(users.deletedAt)))
    .get()

  if (!user) return null

  const nextBalance = user.balance + params.amount
  await db
    .update(users)
    .set({ balance: nextBalance, updatedAt: nowIso() })
    .where(and(eq(users.id, params.userId), isNull(users.deletedAt)))
    .run()

  return nextBalance
}

export async function setUserEmailVerified(db: DbExecutor, params: { userId: string }) {
  await db
    .update(users)
    .set({ isEmailVerified: true, emailVerifiedAt: nowIso(), updatedAt: nowIso() })
    .where(and(eq(users.id, params.userId), isNull(users.deletedAt)))
    .run()
}
