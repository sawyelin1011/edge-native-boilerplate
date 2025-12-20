// Edge-native JWT implementation using Web Crypto API
// Simplified version to avoid TypeScript buffer issues

interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

// Base64URL encoding/decoding
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  return atob(str)
}

// Create JWT token
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours
  }
  
  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  
  // Create signature using simple HMAC
  const data = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)))
  
  return `${data}.${encodedSignature}`
}

// Verify JWT token
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts
    
    // Verify signature by recreating it
    const data = `${encodedHeader}.${encodedPayload}`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const expectedSignature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
    const expectedEncodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(expectedSignature)))
    
    if (expectedEncodedSignature !== encodedSignature) {
      return null
    }
    
    // Decode payload
    const payloadJson = base64UrlDecode(encodedPayload)
    const payload: JWTPayload = JSON.parse(payloadJson)
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}