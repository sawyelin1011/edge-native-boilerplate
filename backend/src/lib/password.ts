import { base64UrlToBytes, bytesToBase64Url, timingSafeEqual } from './crypto'

export type PasswordHash = {
  algorithm: 'pbkdf2-sha256'
  iterations: number
  saltB64: string
  hashB64: string
}

const DEFAULT_ITERATIONS = 210_000
const SALT_BYTES = 16
const DERIVED_KEY_BITS = 256

export async function hashPassword(password: string, options?: { iterations?: number }): Promise<string> {
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS
  const salt = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(salt)

  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits'
  ])

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    DERIVED_KEY_BITS
  )

  const hashBytes = new Uint8Array(derivedBits)

  const parsed: PasswordHash = {
    algorithm: 'pbkdf2-sha256',
    iterations,
    saltB64: bytesToBase64Url(salt),
    hashB64: bytesToBase64Url(hashBytes)
  }

  return `${parsed.algorithm}$${parsed.iterations}$${parsed.saltB64}$${parsed.hashB64}`
}

export async function verifyPassword(params: { password: string; storedHash: string }): Promise<boolean> {
  const parts = params.storedHash.split('$')
  if (parts.length !== 4) return false

  const [algorithm, iterationsRaw, saltB64, hashB64] = parts
  if (algorithm !== 'pbkdf2-sha256') return false

  const iterations = Number(iterationsRaw)
  if (!Number.isSafeInteger(iterations) || iterations <= 0) return false

  const salt = base64UrlToBytes(saltB64)
  const expectedHash = base64UrlToBytes(hashB64)

  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(params.password), 'PBKDF2', false, [
    'deriveBits'
  ])

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    DERIVED_KEY_BITS
  )

  const actualHash = new Uint8Array(derivedBits)
  return timingSafeEqual(actualHash, expectedHash)
}
