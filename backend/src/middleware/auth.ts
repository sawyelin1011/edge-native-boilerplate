import { createMiddleware } from 'hono/factory'
import { verifyJWT } from '../lib/jwt'
import type { Bindings, Variables } from '../index'

// Edge-native authentication middleware
export const authMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - Missing or invalid token' }, 401)
  }
  
  const token = authHeader.substring(7)
  const secret = c.env.JWT_SECRET || 'fallback-secret'
  
  try {
    const payload = await verifyJWT(token, secret)
    
    if (!payload) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401)
    }
    
    // Set user in context
    c.set('user', {
      id: payload.userId,
      email: payload.email,
      role: payload.role
    })
    
    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ error: 'Unauthorized - Token verification failed' }, 401)
  }
})

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuthMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const secret = c.env.JWT_SECRET || 'fallback-secret'
    
    try {
      const payload = await verifyJWT(token, secret)
      
      if (payload) {
        c.set('user', {
          id: payload.userId,
          email: payload.email,
          role: payload.role
        })
      }
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      // Don't fail - just continue without user
    }
  }
  
  await next()
})