import { z } from 'zod'

import type { PluginContext, PluginDefinition } from '../types'
import { timingSafeEqual } from '../../lib/crypto'

type NowPaymentsConfig = {
  apiKey: string
  ipnSecret: string
  apiBaseUrl: string
}

type CreateInvoiceParams = {
  priceAmount: number
  priceCurrency: string
  orderId: string
  orderDescription?: string
  successUrl?: string
  cancelUrl?: string
}

export type NowPaymentsClient = {
  name: 'nowpayments'
  createInvoice: (params: CreateInvoiceParams) => Promise<{ externalId: string; invoiceUrl: string; raw: string }>
  verifyWebhook: (params: { signature: string | null; bodyText: string }) => Promise<boolean>
}

const ConfigSchema = z.object({
  apiKey: z.string().min(10),
  ipnSecret: z.string().min(10),
  apiBaseUrl: z.string().url().default('https://api.nowpayments.io')
})

async function hmacSha512Hex(params: { secret: string; data: string }): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(params.secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(params.data))
  const bytes = new Uint8Array(sig)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyWebhook(params: { secret: string; signature: string | null; bodyText: string }): Promise<boolean> {
  if (!params.signature) return false
  const expectedHex = await hmacSha512Hex({ secret: params.secret, data: params.bodyText })

  // Compare as bytes to avoid timing leaks
  const a = new TextEncoder().encode(params.signature.toLowerCase())
  const b = new TextEncoder().encode(expectedHex.toLowerCase())
  return timingSafeEqual(a, b)
}

async function createClient(ctx: PluginContext, config: NowPaymentsConfig): Promise<NowPaymentsClient> {
  const base = config.apiBaseUrl.replace(/\/+$/, '')

  async function call<T>(path: string, body: unknown): Promise<{ json: T; raw: string }> {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(body)
    })

    const raw = await res.text()
    if (!res.ok) {
      throw new Error(`NOWPayments error (${res.status}): ${raw}`)
    }

    return { json: JSON.parse(raw) as T, raw }
  }

  return {
    name: 'nowpayments',
    async createInvoice(params) {
      const payload = {
        price_amount: params.priceAmount,
        price_currency: params.priceCurrency,
        order_id: params.orderId,
        order_description: params.orderDescription ?? `Deposit for order ${params.orderId}`,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl
      }

      const { json, raw } = await call<{ id: string; invoice_url: string }>('/v1/invoice', payload)

      return {
        externalId: json.id,
        invoiceUrl: json.invoice_url,
        raw
      }
    },
    async verifyWebhook(params) {
      return verifyWebhook({ secret: config.ipnSecret, signature: params.signature, bodyText: params.bodyText })
    }
  }
}

export const nowPaymentsPlugin: PluginDefinition<NowPaymentsConfig, NowPaymentsClient> = {
  name: 'nowpayments',
  type: 'payment',
  version: '1.0.0',
  validateConfig: (raw) => ConfigSchema.parse(raw),
  create: async (ctx, config) => {
    // Touch ctx to keep signature stable (future expansions)
    void ctx
    return createClient(ctx, config)
  }
}
