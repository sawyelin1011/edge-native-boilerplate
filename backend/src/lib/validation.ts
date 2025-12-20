import type { Context } from 'hono'
import type { z } from 'zod'
import { ApiError } from './http/errors'

export async function parseJson<TSchema extends z.ZodTypeAny>(
  c: Context,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Invalid JSON body' })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: parsed.error.flatten()
    })
  }

  return parsed.data
}
