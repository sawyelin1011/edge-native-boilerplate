import { base64UrlToBytes, bytesToBase64Url, hmacSha256, timingSafeEqual } from './crypto'

export type JwtPayload = {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
  jti: string
}

type JwtHeader = {
  alg: 'HS256'
  typ: 'JWT'
}

function encodeJson(input: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(input)))
}

function decodeJson<T>(input: string): T {
  const bytes = base64UrlToBytes(input)
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json) as T
}

export async function createJWT(params: {
  userId: string
  email: string
  role: string
  secret: string
  ttlSeconds: number
  jti?: string
}): Promise<string> {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: JwtPayload = {
    sub: params.userId,
    email: params.email,
    role: params.role,
    iat: now,
    exp: now + params.ttlSeconds,
    jti: params.jti ?? crypto.randomUUID()
  }

  const encodedHeader = encodeJson(header)
  const encodedPayload = encodeJson(payload)
  const data = `${encodedHeader}.${encodedPayload}`

  const signatureBytes = await hmacSha256({ key: params.secret, data })
  const signature = bytesToBase64Url(signatureBytes)

  return `${data}.${signature}`
}

export async function verifyJWT(params: { token: string; secret: string }): Promise<JwtPayload | null> {
  const parts = params.token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, encodedSignature] = parts

  let header: JwtHeader
  try {
    header = decodeJson<JwtHeader>(encodedHeader)
  } catch {
    return null
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') return null

  const data = `${encodedHeader}.${encodedPayload}`
  const expectedSigBytes = await hmacSha256({ key: params.secret, data })
  const expectedSig = base64UrlToBytes(bytesToBase64Url(expectedSigBytes))

  let actualSig: Uint8Array
  try {
    actualSig = base64UrlToBytes(encodedSignature)
  } catch {
    return null
  }

  if (!timingSafeEqual(actualSig, expectedSig)) return null

  let payload: JwtPayload
  try {
    payload = decodeJson<JwtPayload>(encodedPayload)
  } catch {
    return null
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
}
