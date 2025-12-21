import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings, Variables } from '../../../index'
import { ok } from '../../../lib/http/response'
import { parseJson } from '../../../lib/validation'
import { authMiddleware, requirePermission } from '../../../middleware/auth'
import { csrfMiddleware } from '../../../middleware/csrf'
import { listUsers } from '../../../db/repositories/users'
import { listSettings, setSetting } from '../../../db/repositories/siteSettings'
import { upsertPlugin, listActivePlugins } from '../../../db/repositories/plugins'
import { createProvider, listActiveProviders } from '../../../db/repositories/serviceProviders'
import { encryptString } from '../../../gsmflow/encryption'
import { syncAllProviderServices } from '../../../gsmflow/syncServices'

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

admin.use('*', authMiddleware)

admin.get('/site-settings', requirePermission('settings:read'), async (c) => {
  const settings = await listSettings(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: settings }))
})

const UpdateSettingsSchema = z.object({
  settings: z.record(z.string(), z.string())
})

admin.put('/site-settings', requirePermission('settings:write'), csrfMiddleware, async (c) => {
  const body = await parseJson(c, UpdateSettingsSchema)
  const updated = []

  for (const [key, value] of Object.entries(body.settings)) {
    updated.push(await setSetting(c.get('db'), { key, value }))
  }

  return c.json(ok({ requestId: c.get('requestId'), data: updated }))
})

admin.get('/users', requirePermission('users:read'), async (c) => {
  const users = await listUsers(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: users, meta: { total: users.length } }))
})

admin.get('/plugins', requirePermission('plugins:read'), async (c) => {
  const plugins = await listActivePlugins(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: plugins }))
})

const UpsertPluginSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  version: z.string().min(1).default('1.0.0'),
  isActive: z.boolean().default(true),
  config: z.unknown().optional()
})

admin.post('/plugins', requirePermission('plugins:write'), csrfMiddleware, async (c) => {
  const body = await parseJson(c, UpsertPluginSchema)
  const plugin = await upsertPlugin(c.get('db'), {
    name: body.name,
    type: body.type,
    version: body.version,
    isActive: body.isActive,
    config: body.config ? JSON.stringify(body.config) : null
  })

  return c.json(ok({ requestId: c.get('requestId'), data: plugin }), 201)
})

admin.get('/providers', requirePermission('services:read'), async (c) => {
  const providers = await listActiveProviders(c.get('db'))
  return c.json(ok({ requestId: c.get('requestId'), data: providers }))
})

const CreateProviderSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1).default('dhru'),
  adapterType: z.string().min(1).default('dhru'),
  apiUrl: z.string().url(),
  priority: z.number().int().min(0).default(0),
  credentials: z.object({
    username: z.string().min(1),
    apiKey: z.string().min(1)
  }),
  configuration: z.unknown().optional()
})

admin.post('/providers', requirePermission('services:write'), csrfMiddleware, async (c) => {
  const body = await parseJson(c, CreateProviderSchema)
  const secret = c.get('config').gsmflow.encryptionKey

  const credentialsEncrypted = await encryptString({ plaintext: JSON.stringify(body.credentials), secret })

  const provider = await createProvider(c.get('db'), {
    name: body.name,
    type: body.type,
    adapterType: body.adapterType,
    apiUrl: body.apiUrl,
    credentialsEncrypted,
    configuration: body.configuration ? JSON.stringify(body.configuration) : null,
    priority: body.priority
  })

  return c.json(ok({ requestId: c.get('requestId'), data: provider }), 201)
})

admin.post('/providers/sync-services', requirePermission('services:write'), csrfMiddleware, async (c) => {
  const result = await syncAllProviderServices({ db: c.get('db'), kv: c.env.KV, config: c.get('config') })
  return c.json(ok({ requestId: c.get('requestId'), data: result }))
})

export { admin as gsmflowAdminRoutesV1 }
