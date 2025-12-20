import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

const nowIso = () => new Date().toISOString()

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  passwordHash: text('password_hash'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export const posts = sqliteTable('posts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  slug: text('slug').notNull().unique(),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  authorId: text('author_id').notNull().references(() => users.id),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export const products = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  sku: text('sku').notNull().unique(),
  stock: integer('stock').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
