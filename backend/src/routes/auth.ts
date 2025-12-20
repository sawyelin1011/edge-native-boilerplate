import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '../lib/schema'
import { createJWT, verifyJWT } from '../lib/jwt'
import type { Bindings, Variables } from '../index'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6)
})

// Simple password hashing using Web Crypto API (edge-native)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === hash
}

// Register endpoint
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { email, name, password } = RegisterSchema.parse(body)
    
    const db = c.get('db')
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get()
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const newUser = await db.insert(users).values({
      email,
      name,
      // Store password hash in a real app - this is just a demo
      role: 'user'
    }).returning()
    
    // Create JWT token
    const token = await createJWT({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role
    }, c.env.JWT_SECRET || 'fallback-secret')
    
    return c.json({
      data: {
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          role: newUser[0].role
        },
        token
      }
    }, 201)
    
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

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = LoginSchema.parse(body)
    
    const db = c.get('db')
    
    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).get()
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // In a real app, verify password hash
    // For demo purposes, we'll just check if password is provided
    if (!password) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Create JWT token
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    }, c.env.JWT_SECRET || 'fallback-secret')
    
    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    })
    
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

// Get current user
auth.get('/me', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  return c.json({ data: user })
})

export { auth as authRoutes }