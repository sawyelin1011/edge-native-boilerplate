import { and, eq, isNull } from 'drizzle-orm'
import type { Database } from '../client'
import { posts } from '../../lib/schema'

const nowIso = () => new Date().toISOString()

export async function listPosts(db: Database) {
  return db.select().from(posts).where(isNull(posts.deletedAt)).all()
}

export async function createPost(
  db: Database,
  params: { title: string; content?: string; slug: string; published: boolean; authorId: string }
) {
  const [post] = await db
    .insert(posts)
    .values({
      title: params.title,
      content: params.content,
      slug: params.slug,
      published: params.published,
      authorId: params.authorId,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
    .returning()

  return post
}

export async function softDeletePost(db: Database, postId: string) {
  await db
    .update(posts)
    .set({ deletedAt: nowIso(), updatedAt: nowIso() })
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .run()
}
