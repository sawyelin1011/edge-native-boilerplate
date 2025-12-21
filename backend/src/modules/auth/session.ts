import type { AuthUser } from './types'
import { randomHex } from '../../lib/crypto'

export type SessionData = {
  sessionId: string
  user: AuthUser
  createdAt: string
  lastRotatedAt: string
  csrfToken: string
}

function key(sessionId: string) {
  return `session:${sessionId}`
}

export async function createSession(params: { kv: KVNamespace; user: AuthUser; ttlSeconds: number }): Promise<SessionData> {
  const now = new Date().toISOString()
  const session: SessionData = {
    sessionId: crypto.randomUUID(),
    user: params.user,
    createdAt: now,
    lastRotatedAt: now,
    csrfToken: randomHex(32)
  }

  await params.kv.put(key(session.sessionId), JSON.stringify(session), {
    expirationTtl: params.ttlSeconds
  })

  return session
}

export async function getSession(params: {
  kv: KVNamespace
  sessionId: string
}): Promise<SessionData | null> {
  const raw = await params.kv.get(key(params.sessionId))
  if (!raw) return null

  try {
    const data = JSON.parse(raw) as SessionData
    if (!data.sessionId || !data.user?.id) return null
    return data
  } catch {
    return null
  }
}

export async function rotateSession(params: {
  kv: KVNamespace
  session: SessionData
  ttlSeconds: number
}): Promise<SessionData> {
  const now = new Date().toISOString()
  const next: SessionData = {
    ...params.session,
    sessionId: crypto.randomUUID(),
    lastRotatedAt: now,
    csrfToken: randomHex(32)
  }

  await Promise.all([
    params.kv.put(key(next.sessionId), JSON.stringify(next), { expirationTtl: params.ttlSeconds }),
    params.kv.delete(key(params.session.sessionId))
  ])

  return next
}

export async function deleteSession(params: { kv: KVNamespace; sessionId: string }): Promise<void> {
  await params.kv.delete(key(params.sessionId))
}
