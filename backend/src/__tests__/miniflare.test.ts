import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readMigration(name: string) {
  return readFileSync(resolve(__dirname, `../../../migrations/${name}`), 'utf8')
}

describe('backend (Miniflare)', () => {
  const mf = new Miniflare({
    scriptPath: resolve(__dirname, '../../index.ts'),
    modules: true,
    compatibilityDate: '2024-12-21',
    d1Databases: { DB: 'test-db' },
    kvNamespaces: ['KV'],
    r2Buckets: ['BUCKET'],
    bindings: {
      ENVIRONMENT: 'test',
      JWT_SECRET: 'test-jwt-secret-32-characters-minimum',
      SESSION_SECRET: 'test-session-secret-32-characters-minimum',
      RATE_LIMIT_ENABLED: 'false'
    }
  })

  beforeAll(async () => {
    const db = await mf.getD1Database('DB')
    await db.exec(readMigration('0001_initial.sql'))
    await db.exec(readMigration('0002_auth_soft_delete.sql'))
  })

  afterAll(async () => {
    await mf.dispose()
  })

  it('serves health', async () => {
    const res = await mf.dispatchFetch('http://localhost/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as { success: boolean }
    expect(json.success).toBe(true)
  })

  it('registers and logs in', async () => {
    const registerRes = await mf.dispatchFetch('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com', name: 'A', password: 'password1234' })
    })

    expect(registerRes.status).toBe(201)

    const loginRes = await mf.dispatchFetch('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com', password: 'password1234' })
    })

    expect(loginRes.status).toBe(200)
    const json = (await loginRes.json()) as { success: boolean; data: { tokens: { accessToken: string } } }
    expect(json.success).toBe(true)
    expect(json.data.tokens.accessToken).toBeTypeOf('string')
  })
})
