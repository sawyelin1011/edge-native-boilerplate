import { SignJWT, jwtVerify } from 'jose'

export type JwtPayload = {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
  jti: string
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function createJWT(params: {
  userId: string
  email: string
  role: string
  secret: string
  ttlSeconds: number
  jti?: string
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const token = await new SignJWT({ email: params.email, role: params.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(params.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + params.ttlSeconds)
    .setJti(params.jti ?? crypto.randomUUID())
    .sign(secretKey(params.secret))

  return token
}

export async function verifyJWT(params: { token: string; secret: string }): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(params.token, secretKey(params.secret), {
      algorithms: ['HS256']
    })

    if (!payload.sub || typeof payload.sub !== 'string') return null
    if (typeof payload.email !== 'string' || typeof payload.role !== 'string') return null
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
      jti: typeof payload.jti === 'string' ? payload.jti : ''
    }
  } catch {
    return null
  }
}
