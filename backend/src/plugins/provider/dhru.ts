import { z } from 'zod'

import type { PluginContext, PluginDefinition } from '../types'

export type ServiceType = 'IMEI' | 'SERVER' | 'FILE' | 'REMOTE'

export type ProviderService = {
  externalServiceId: string
  serviceType: ServiceType
  name: string
  description: string | null
  apiPrice: number
  currency: string
  category: string | null
  isActive: boolean
}

export type PlaceOrderResult = {
  externalOrderId: string
  raw: string
}

export type CheckOrderResult = {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  result: string | null
  raw: string
}

type DhruConfig = {
  apiBaseUrl: string
  username: string
  apiKey: string
}

export type DhruProviderClient = {
  name: 'dhru'
  syncServices: () => Promise<ProviderService[]>
  placeOrder: (params: { serviceType: ServiceType; externalServiceId: string; payload: Record<string, unknown> }) => Promise<PlaceOrderResult>
  checkStatus: (params: { serviceType: ServiceType; externalOrderId: string }) => Promise<CheckOrderResult>
}

const ConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  username: z.string().min(1),
  apiKey: z.string().min(1)
})

function serviceListPath(type: ServiceType): string {
  switch (type) {
    case 'IMEI':
      return '/api/imeiservicelist'
    case 'SERVER':
      return '/api/serverservicelist'
    case 'FILE':
      return '/api/fileservicelist'
    case 'REMOTE':
      return '/api/remoteservicelist'
  }
}

function placeOrderPath(type: ServiceType): string {
  switch (type) {
    case 'IMEI':
      return '/api/placeimeiorder'
    case 'SERVER':
      return '/api/placeserverorder'
    case 'FILE':
      return '/api/placefileorder'
    case 'REMOTE':
      return '/api/placeremoteorder'
  }
}

function checkOrderPath(type: ServiceType): string {
  switch (type) {
    case 'IMEI':
      return '/api/getimeiorder'
    case 'SERVER':
      return '/api/checkorderstatus'
    case 'FILE':
      return '/api/checkorderstatus'
    case 'REMOTE':
      return '/api/checkorderstatus'
  }
}

function buildUrl(config: DhruConfig, path: string): URL {
  const base = config.apiBaseUrl.replace(/\/+$/, '')
  const url = new URL(`${base}${path}`)
  url.searchParams.set('username', config.username)
  url.searchParams.set('apiaccesskey', config.apiKey)
  url.searchParams.set('response_type', 'json')
  return url
}

async function fetchJson(url: URL, init?: RequestInit): Promise<{ json: unknown; raw: string }> {
  const res = await fetch(url.toString(), init)
  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`DHRU error (${res.status}): ${raw}`)
  }

  return { json: JSON.parse(raw) as unknown, raw }
}

function parseServices(serviceType: ServiceType, json: unknown): ProviderService[] {
  // DHRU can return different shapes; this parser attempts to normalize a few common cases.
  if (typeof json !== 'object' || json === null) return []

  const root = json as Record<string, unknown>
  const list = (root.services ?? root.servicelist ?? root.data) as unknown

  const arr = Array.isArray(list) ? list : typeof list === 'object' && list !== null ? Object.values(list as Record<string, unknown>) : []

  return arr
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const it = item as Record<string, unknown>
      const id = String(it.service_id ?? it.id ?? it.serviceid ?? '')
      const name = String(it.service_name ?? it.name ?? it.servicename ?? '')
      const price = Number(it.price ?? it.api_price ?? it.credit ?? 0)
      const active = Boolean(it.is_active ?? it.active ?? true)
      if (!id || !name) return null

      return {
        externalServiceId: id,
        serviceType,
        name,
        description: typeof it.description === 'string' ? it.description : null,
        apiPrice: Number.isFinite(price) ? price : 0,
        currency: typeof it.currency === 'string' ? it.currency : 'USD',
        category: typeof it.category === 'string' ? it.category : null,
        isActive: active
      } satisfies ProviderService
    })
    .filter((v): v is ProviderService => Boolean(v))
}

function parsePlaceOrder(json: unknown): { externalOrderId: string } | null {
  if (typeof json !== 'object' || json === null) return null
  const root = json as Record<string, unknown>
  const id = root.order_id ?? root.orderid ?? root.id
  if (!id) return null
  return { externalOrderId: String(id) }
}

function parseOrderStatus(json: unknown): { status: 'PROCESSING' | 'COMPLETED' | 'FAILED'; result: string | null } {
  if (typeof json !== 'object' || json === null) {
    return { status: 'PROCESSING', result: null }
  }

  const root = json as Record<string, unknown>
  const statusRaw = String(root.status ?? root.order_status ?? root.state ?? 'PROCESSING').toUpperCase()

  const status = statusRaw.includes('COMPLETE') || statusRaw === 'DONE' ? 'COMPLETED' : statusRaw.includes('FAIL') ? 'FAILED' : 'PROCESSING'
  const result = typeof root.result === 'string' ? root.result : typeof root.message === 'string' ? root.message : null
  return { status, result }
}

async function createClient(_ctx: PluginContext, config: DhruConfig): Promise<DhruProviderClient> {
  return {
    name: 'dhru',
    async syncServices() {
      const all: ProviderService[] = []
      for (const type of ['IMEI', 'SERVER', 'FILE', 'REMOTE'] as const) {
        const url = buildUrl(config, serviceListPath(type))
        const { json } = await fetchJson(url)
        all.push(...parseServices(type, json))
      }
      return all
    },
    async placeOrder(params) {
      const url = buildUrl(config, placeOrderPath(params.serviceType))
      const { json, raw } = await fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service_id: params.externalServiceId, ...params.payload })
      })

      const parsed = parsePlaceOrder(json)
      if (!parsed) {
        throw new Error('DHRU placeOrder: could not parse external order id')
      }

      return { externalOrderId: parsed.externalOrderId, raw }
    },
    async checkStatus(params) {
      const url = buildUrl(config, checkOrderPath(params.serviceType))
      const { json, raw } = await fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: params.externalOrderId })
      })

      const parsed = parseOrderStatus(json)
      return { ...parsed, raw }
    }
  }
}

export const dhruProviderPlugin: PluginDefinition<DhruConfig, DhruProviderClient> = {
  name: 'dhru',
  type: 'provider',
  version: '1.0.0',
  validateConfig: (raw) => ConfigSchema.parse(raw),
  create: (ctx, config) => createClient(ctx, config)
}
