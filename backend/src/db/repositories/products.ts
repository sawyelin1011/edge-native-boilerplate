import { and, eq, isNull } from 'drizzle-orm'
import type { DbExecutor } from '../client'
import { products } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export async function listProducts(db: DbExecutor) {
  return db.select().from(products).where(isNull(products.deletedAt)).all()
}

export async function createProduct(
  db: DbExecutor,
  params: { name: string; description?: string; price: number; sku: string; stock: number }
) {
  const [product] = await db
    .insert(products)
    .values({
      name: params.name,
      description: params.description,
      price: params.price,
      sku: params.sku,
      stock: params.stock,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
    .returning()

  return product
}

export async function softDeleteProduct(db: DbExecutor, productId: string) {
  await db
    .update(products)
    .set({ deletedAt: nowIso(), updatedAt: nowIso() })
    .where(and(eq(products.id, productId), isNull(products.deletedAt)))
    .run()
}
