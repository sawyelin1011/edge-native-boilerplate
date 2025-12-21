import { base64UrlToBytes, bytesToBase64Url, hmacSha256, timingSafeEqual } from '../../lib/crypto'

export async function signUpload(params: { secret: string; key: string; expiresAt: number }): Promise<string> {
  const data = `${params.key}.${params.expiresAt}`
  const sigBytes = await hmacSha256({ key: params.secret, data })
  return bytesToBase64Url(sigBytes)
}

export async function verifyUploadSignature(params: {
  secret: string
  key: string
  expiresAt: number
  signature: string
}): Promise<boolean> {
  if (params.expiresAt <= Math.floor(Date.now() / 1000)) return false
  const expected = await signUpload({ secret: params.secret, key: params.key, expiresAt: params.expiresAt })

  try {
    return timingSafeEqual(base64UrlToBytes(params.signature), base64UrlToBytes(expected))
  } catch {
    return false
  }
}
