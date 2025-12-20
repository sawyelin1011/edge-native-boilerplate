import { bytesToBase64Url, randomHex } from '../../lib/crypto'

type RefreshTokenRecord = {
  userId: string
  createdAt: string
}

function key(hashB64: string) {
  return `refresh:${hashB64}`
}

async function sha256Base64Url(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return bytesToBase64Url(new Uint8Array(digest))
}

export async function issueRefreshToken(params: {
  kv: KVNamespace
  userId: string
  ttlSeconds: number
}): Promise<{ token: string }> {
  const token = randomHex(32)
  const hash = await sha256Base64Url(token)
  const record: RefreshTokenRecord = { userId: params.userId, createdAt: new Date().toISOString() }

  await params.kv.put(key(hash), JSON.stringify(record), { expirationTtl: params.ttlSeconds })

  return { token }
}

export async function rotateRefreshToken(params: {
  kv: KVNamespace
  refreshToken: string
  ttlSeconds: number
}): Promise<{ userId: string; refreshToken: string } | null> {
  const hash = await sha256Base64Url(params.refreshToken)
  const existingRaw = await params.kv.get(key(hash))
  if (!existingRaw) return null

  let record: RefreshTokenRecord
  try {
    record = JSON.parse(existingRaw) as RefreshTokenRecord
  } catch {
    return null
  }

  await params.kv.delete(key(hash))

  const next = await issueRefreshToken({ kv: params.kv, userId: record.userId, ttlSeconds: params.ttlSeconds })
  return { userId: record.userId, refreshToken: next.token }
}

export async function revokeRefreshToken(params: {
  kv: KVNamespace
  refreshToken: string
}): Promise<void> {
  const hash = await sha256Base64Url(params.refreshToken)
  await params.kv.delete(key(hash))
}
