import { Hono } from 'hono'
import { like, eq, and, or, desc } from 'drizzle-orm'
import { db, questions, questionTags, users } from '../db/index.js'
import { sql } from 'drizzle-orm'
import { AppError } from '../auth/errors.js'

const search = new Hono()

// GET /search?q=...&tagId=...&author=...&limit=...
search.get('/', async (c) => {
  const q       = c.req.query('q')?.trim() ?? ''
  const tagId   = c.req.query('tagId') ? Number(c.req.query('tagId')) : undefined
  const author  = c.req.query('author')?.trim() ?? ''
  const limit   = Math.min(Number(c.req.query('limit') ?? 30), 100)

  if (!q && !tagId && !author) {
    throw new AppError('Provide at least one search parameter', 400, 'NO_QUERY')
  }

  const conditions = []

  if (q) {
    conditions.push(
      or(
        like(questions.title,   `%${q}%`),
        like(questions.content, `%${q}%`),
      )
    )
  }

  if (tagId) {
    conditions.push(eq(questions.tagId, tagId))
  }

  if (author) {
    conditions.push(like(users.username, `%${author}%`))
  }

  const results = await db
    .select({
      id:            questions.id,
      title:         questions.title,
      content:       questions.content,
      createdAt:     questions.createdAt,
      authorId:      users.id,
      authorName:    users.username,
      tagId:         questionTags.id,
      tagName:       questionTags.name,
      tagShort:      questionTags.short,
      tagColor:      questionTags.color,
      replyCount:    sql<number>`(SELECT COUNT(*) FROM forumReply WHERE question_id = ${questions.id})`,
      reactionCount: sql<number>`(SELECT COUNT(*) FROM forumReaction WHERE forum_id = ${questions.id})`,
    })
    .from(questions)
    .leftJoin(users,        eq(questions.userId,  users.id))
    .leftJoin(questionTags, eq(questions.tagId,   questionTags.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(questions.createdAt))
    .limit(limit)

  return c.json({ results, total: results.length })
})

export { search }