import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings, Variables } from '../../../index'
import { ok } from '../../../lib/http/response'
import { parseJson } from '../../../lib/validation'
import { authMiddleware, requirePermission } from '../../../middleware/auth'
import { csrfMiddleware } from '../../../middleware/csrf'
import { createApiError } from '../../../lib/http/errors'
import { createPluginInstance } from '../../../gsmflow/pluginRuntime'
import type { NowPaymentsClient } from '../../../plugins/payment/nowpayments'
import { createPayment, getPaymentByExternalId, getPaymentById, setPaymentExternal, updatePaymentStatus } from '../../../db/repositories/payments'
import { addUserBalance } from '../../../db/repositories/users'

const paymentsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CreateInvoiceSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(8).default('USD')
})

paymentsRoute.post('/invoice', authMiddleware, requirePermission('payments:write'), csrfMiddleware, async (c) => {
  const user = c.get('user')
  if (!user) {
    throw createApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }

  const body = await parseJson(c, CreateInvoiceSchema)

  const payment = await createPayment(c.get('db'), {
    userId: user.id,
    gateway: 'nowpayments',
    status: 'PENDING',
    amount: body.amount,
    currency: body.currency,
    externalId: null,
    checkoutUrl: null,
    raw: null
  })

  const nowpayments = await createPluginInstance<NowPaymentsClient>({
    ctx: { db: c.get('db'), kv: c.env.KV, config: c.get('config') },
    name: 'nowpayments'
  })

  const origin = new URL(c.req.url).origin

  const invoice = await nowpayments.createInvoice({
    priceAmount: body.amount,
    priceCurrency: body.currency,
    orderId: payment.id,
    successUrl: `${origin}/payments/success`,
    cancelUrl: `${origin}/payments/cancel`
  })

  await setPaymentExternal(c.get('db'), {
    id: payment.id,
    externalId: invoice.externalId,
    checkoutUrl: invoice.invoiceUrl,
    raw: invoice.raw
  })

  const updated = await getPaymentById(c.get('db'), payment.id)

  return c.json(ok({ requestId: c.get('requestId'), data: updated }), 201)
})

paymentsRoute.post('/webhook', async (c) => {
  const signature = c.req.header('x-nowpayments-sig') ?? null
  const bodyText = await c.req.text()

  const nowpayments = await createPluginInstance<NowPaymentsClient>({
    ctx: { db: c.get('db'), kv: c.env.KV, config: c.get('config') },
    name: 'nowpayments'
  })

  const valid = await nowpayments.verifyWebhook({ signature, bodyText })
  if (!valid) {
    throw createApiError({ status: 403, code: 'FORBIDDEN', message: 'Invalid webhook signature' })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(bodyText) as Record<string, unknown>
  } catch {
    throw createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Invalid JSON webhook body' })
  }

  const externalId = String(payload.invoice_id ?? payload.id ?? '')
  const orderId = String(payload.order_id ?? payload.orderId ?? '')
  const status = String(payload.payment_status ?? payload.status ?? '').toUpperCase()

  if (!externalId && !orderId) {
    throw createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Missing invoice identifiers' })
  }

  const payment = externalId ? await getPaymentByExternalId(c.get('db'), externalId) : await getPaymentById(c.get('db'), orderId)

  if (!payment) {
    // Webhook arrived before we stored it or for unknown invoice.
    return c.json(ok({ requestId: c.get('requestId'), data: { received: true } }))
  }

  if (status === 'FINISHED' || status === 'CONFIRMED' || status === 'PAID') {
    await c.get('db').transaction(async (tx) => {
      await updatePaymentStatus(tx, { id: payment.id, status: 'CONFIRMED', raw: bodyText })
      await addUserBalance(tx, { userId: payment.userId, amount: payment.amount })
    })
  }

  if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED') {
    await updatePaymentStatus(c.get('db'), { id: payment.id, status: 'FAILED', raw: bodyText })
  }

  return c.json(ok({ requestId: c.get('requestId'), data: { received: true } }))
})

export { paymentsRoute as gsmflowPaymentsRoutesV1 }
