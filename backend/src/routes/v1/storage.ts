import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings, Variables } from '../../index'
import { ok } from '../../lib/http/response'
import { parseJson } from '../../lib/validation'
import { createApiError } from '../../lib/http/errors'
import { signUpload, verifyUploadSignature } from '../../modules/storage/signedUpload'
import { randomHex } from '../../lib/crypto'
import { authMiddleware, requirePermission } from '../../middleware/auth'

const storage = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const SignedUploadSchema = z.object({
  prefix: z.string().max(200).optional(),
  contentType: z.string().max(200).optional()
})

const SignedDownloadSchema = z.object({
  key: z.string().min(1).max(1024)
})

storage.post('/signed-upload', authMiddleware, requirePermission('admin'), async (c) => {
  const config = c.get('config')
  if (!config.storage.enabled || !config.storage.signingSecret) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Storage module disabled' })
  }

  const body = await parseJson(c, SignedUploadSchema)

  const prefix = body.prefix?.replace(/^\/+/, '').replace(/\/+$/, '')
  const key = `${prefix ? `${prefix}/` : ''}${crypto.randomUUID()}-${randomHex(8)}`

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60
  const sig = await signUpload({ secret: config.storage.signingSecret, key, expiresAt })

  const uploadUrl = new URL(c.req.url)
  uploadUrl.pathname = `/api/v1/storage/upload/${encodeURIComponent(key)}`
  uploadUrl.searchParams.set('exp', String(expiresAt))
  uploadUrl.searchParams.set('sig', sig)

  return c.json(
    ok({
      requestId: c.get('requestId'),
      data: {
        key,
        uploadUrl: uploadUrl.toString(),
        expiresAt,
        contentType: body.contentType ?? null
      }
    })
  )
})

storage.post('/signed-download', authMiddleware, async (c) => {
  const config = c.get('config')
  if (!config.storage.enabled || !config.storage.signingSecret) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Storage module disabled' })
  }

  const body = await parseJson(c, SignedDownloadSchema)

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60
  const sig = await signUpload({ secret: config.storage.signingSecret, key: body.key, expiresAt })

  const url = new URL(c.req.url)
  url.pathname = `/api/v1/storage/objects/${encodeURIComponent(body.key)}`
  url.searchParams.set('exp', String(expiresAt))
  url.searchParams.set('sig', sig)

  return c.json(ok({ requestId: c.get('requestId'), data: { downloadUrl: url.toString(), expiresAt } }))
})

storage.put('/upload/:key', async (c) => {
  const config = c.get('config')
  if (!config.storage.enabled || !config.storage.signingSecret) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Storage module disabled' })
  }

  const key = decodeURIComponent(c.req.param('key'))
  const expiresAt = Number(c.req.query('exp'))
  const sig = c.req.query('sig')

  if (!sig || !Number.isFinite(expiresAt)) {
    throw createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Missing signature parameters' })
  }

  const okSig = await verifyUploadSignature({ secret: config.storage.signingSecret, key, expiresAt, signature: sig })
  if (!okSig) {
    throw createApiError({ status: 403, code: 'FORBIDDEN', message: 'Invalid or expired upload signature' })
  }

  const bucket = c.env.BUCKET
  if (!bucket) {
    throw createApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'R2 bucket binding is missing' })
  }

  const contentType = c.req.header('Content-Type') ?? 'application/octet-stream'
  await bucket.put(key, c.req.raw.body, {
    httpMetadata: {
      contentType
    }
  })

  return c.json(ok({ requestId: c.get('requestId'), data: { key } }), 201)
})

storage.get('/objects/:key', async (c) => {
  const config = c.get('config')
  if (!config.storage.enabled || !config.storage.signingSecret) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Storage module disabled' })
  }

  const key = decodeURIComponent(c.req.param('key'))
  const expiresAt = Number(c.req.query('exp'))
  const sig = c.req.query('sig')

  if (!sig || !Number.isFinite(expiresAt)) {
    throw createApiError({ status: 403, code: 'FORBIDDEN', message: 'Missing access signature' })
  }

  const okSig = await verifyUploadSignature({ secret: config.storage.signingSecret, key, expiresAt, signature: sig })
  if (!okSig) {
    throw createApiError({ status: 403, code: 'FORBIDDEN', message: 'Invalid or expired access signature' })
  }

  const bucket = c.env.BUCKET
  if (!bucket) {
    throw createApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'R2 bucket binding is missing' })
  }

  const object = await bucket.get(key)
  if (!object) {
    throw createApiError({ status: 404, code: 'NOT_FOUND', message: 'Object not found' })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'private, max-age=60')

  return new Response(object.body, { headers })
})

export { storage as storageRoutesV1 }
