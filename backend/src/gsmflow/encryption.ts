import { base64UrlToBytes, bytesToBase64Url } from '../lib/crypto'

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptString(params: { plaintext: string; secret: string }): Promise<string> {
  const key = await deriveAesKey(params.secret)
  const iv = new Uint8Array(new ArrayBuffer(12))
  crypto.getRandomValues(iv)

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    new TextEncoder().encode(params.plaintext)
  )

  return `${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`
}

export async function decryptString(params: { encrypted: string; secret: string }): Promise<string> {
  const [ivB64, dataB64] = params.encrypted.split('.')
  if (!ivB64 || !dataB64) throw new Error('Invalid encrypted payload')

  const key = await deriveAesKey(params.secret)
  const iv = base64UrlToBytes(ivB64)
  const data = base64UrlToBytes(dataB64)

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  )

  return new TextDecoder().decode(new Uint8Array(plaintext))
}
