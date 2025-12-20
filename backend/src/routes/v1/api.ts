import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings, Variables } from '../../index'
import { ok } from '../../lib/http/response'
import { parseJson } from '../../lib/validation'
import { authMiddleware, requirePermission } from '../../middleware/auth'
import { csrfMiddleware } from '../../middleware/csrf'
import { createUser, findUserById, listUsers } from '../../db/repositories/users'
import { createPost, listPosts } from '../../db/repositories/posts'
import { createProduct, listProducts } from '../../db/repositories/products'
import { createApiError } from '../../lib/http/errors'
import { hashPassword } from '../../lib/password'

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: z.enum(['admin', 'user']).default('user'),
  password: z.string().min(8).max(256)
})

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50_000).optional(),
  slug: z.string().min(1).max(200),
  published: z.boolean().default(false),
  authorId: z.string().uuid()
})

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  price: z.number().positive(),
  sku: z.string().min(1).max(64),
  stock: z.number().int().min(0).default(0)
})

api.get('/users', authMiddleware, requirePermission('users:read'), async (c) => {
  const all = await listUsers(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: all, meta: { total: all.length } }))
})

api.post('/users', authMiddleware, requirePermission('users:write'), csrfMiddleware, async (c) => {
  const body = await parseJson(c, CreateUserSchema)
  const passwordHash = await hashPassword(body.password)

  const user = await createUser(c.get('db'), {
    email: body.email,
    name: body.name,
    role: body.role,
    passwordHash
  })

  return c.json(ok({ requestId: c.get('requestId'), data: user }), 201)
})

api.get('/users/:id', authMiddleware, requirePermission('users:read'), async (c) => {
  const user = await findUserById(c.get('db'), c.req.param('id'))
  if (!user) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'User not found' })
  }

  return c.json(ok({ requestId: c.get('requestId'), data: user }))
})

api.get('/posts', async (c) => {
  const all = await listPosts(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: all, meta: { total: all.length } }))
})

api.post('/posts', authMiddleware, requirePermission('posts:write'), csrfMiddleware, async (c) => {
  const body = await parseJson(c, CreatePostSchema)
  const post = await createPost(c.get('db'), body)
  return c.json(ok({ requestId: c.get('requestId'), data: post }), 201)
})

api.get('/products', async (c) => {
  const all = await listProducts(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: all, meta: { total: all.length } }))
})

api.post('/products', authMiddleware, requirePermission('products:write'), csrfMiddleware, async (c) => {
  const body = await parseJson(c, CreateProductSchema)
  const product = await createProduct(c.get('db'), body)
  return c.json(ok({ requestId: c.get('requestId'), data: product }), 201)
})

export { api as apiRoutesV1 }
