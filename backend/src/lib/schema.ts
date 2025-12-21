import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const nowIso = () => new Date().toISOString()

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('USER'),
  passwordHash: text('password_hash'),

  balance: real('balance').notNull().default(0),
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).notNull().default(false),
  emailVerifiedAt: text('email_verified_at'),

  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).notNull().default(false),
  totpSecretEncrypted: text('totp_secret_encrypted'),
  phone: text('phone'),

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

export const serviceProviders = sqliteTable('service_providers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull(),
  adapterType: text('adapter_type').notNull(),
  apiUrl: text('api_url').notNull(),
  credentialsEncrypted: text('credentials_encrypted'),
  configuration: text('configuration'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  priority: integer('priority').notNull().default(0),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export const services = sqliteTable(
  'services',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    providerId: text('provider_id').notNull().references(() => serviceProviders.id),
    externalServiceId: text('external_service_id').notNull(),
    serviceType: text('service_type').notNull(),
    name: text('name').notNull(),
    description: text('description'),

    apiPrice: real('api_price').notNull(),
    basePrice: real('base_price').notNull(),
    currency: text('currency').notNull().default('USD'),

    category: text('category'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull().$defaultFn(nowIso),
    updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
  },
  (t) => ({
    providerExternalUnique: uniqueIndex('services_provider_external_unique').on(t.providerId, t.externalServiceId)
  })
)

export const orders = sqliteTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  providerId: text('provider_id').notNull().references(() => serviceProviders.id),

  status: text('status').notNull().default('PENDING'),
  price: real('price').notNull(),
  apiPrice: real('api_price').notNull(),
  currency: text('currency').notNull().default('USD'),

  externalOrderId: text('external_order_id'),
  payload: text('payload'),
  result: text('result'),
  failureReason: text('failure_reason'),
  refundedAt: text('refunded_at'),

  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export const payments = sqliteTable('payments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  gateway: text('gateway').notNull(),
  status: text('status').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),

  externalId: text('external_id'),
  checkoutUrl: text('checkout_url'),
  raw: text('raw'),

  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export const plugins = sqliteTable('plugins', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull(),
  version: text('version').notNull().default('1.0.0'),
  config: text('config'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ServiceProvider = typeof serviceProviders.$inferSelect
export type NewServiceProvider = typeof serviceProviders.$inferInsert
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Plugin = typeof plugins.$inferSelect
export type NewPlugin = typeof plugins.$inferInsert
export type SiteSetting = typeof siteSettings.$inferSelect
