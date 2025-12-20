import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users, posts, products } from '../lib/schema'
import type { Bindings, Variables } from '../index'

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Validation schemas - edge-native with Zod
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user']).default('user')
})

const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  slug: z.string().min(1),
  published: z.boolean().default(false),
  authorId: z.string().uuid()
})

const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  sku: z.string().min(1),
  stock: z.number().int().min(0).default(0)
})

// Users endpoints
api.get('/users', async (c) => {
  const db = c.get('db')
  const allUsers = await db.select().from(users)
  
  return c.json({
    data: allUsers,
    meta: { total: allUsers.length }
  })
})

api.post('/users', async (c) => {
  try {
    const body = await c.req.json()
    const userData = CreateUserSchema.parse(body)
    
    const db = c.get('db')
    const newUser = await db.insert(users).values(userData).returning()
    
    return c.json({ data: newUser[0] }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    throw error
  }
})

api.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.get('db')
  
  const user = await db.select().from(users).where(eq(users.id, id)).get()
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  return c.json({ data: user })
})

// Posts endpoints
api.get('/posts', async (c) => {
  const db = c.get('db')
  const allPosts = await db.select().from(posts)
  
  return c.json({
    data: allPosts,
    meta: { total: allPosts.length }
  })
})

api.post('/posts', async (c) => {
  try {
    const body = await c.req.json()
    const postData = CreatePostSchema.parse(body)
    
    const db = c.get('db')
    const newPost = await db.insert(posts).values(postData).returning()
    
    return c.json({ data: newPost[0] }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    throw error
  }
})

// Products endpoints
api.get('/products', async (c) => {
  const db = c.get('db')
  const allProducts = await db.select().from(products)
  
  return c.json({
    data: allProducts,
    meta: { total: allProducts.length }
  })
})

api.post('/products', async (c) => {
  try {
    const body = await c.req.json()
    const productData = CreateProductSchema.parse(body)
    
    const db = c.get('db')
    const newProduct = await db.insert(products).values(productData).returning()
    
    return c.json({ data: newProduct[0] }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    throw error
  }
})

export { api as apiRoutes }