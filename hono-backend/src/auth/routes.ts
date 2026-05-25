import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schemas/users.js'
import { hashPassword, verifyPassword } from './password.js'
import { createSession, clearSession, getSession } from './session.js'
import { AuthError, ValidationError, ForbiddenError } from './errors.js'

import { requireAuth } from '../auth/middleware.js'
import {
  getRecentQuestions, getMostViewedQuestions,
  getQuestionById, createQuestion, deleteQuestion,
  getRepliesForQuestion, createReply, deleteReply,
  getAllTags, createTag,
} from '../db/controllers/questions.js'

const forums = new Hono()

const auth = new Hono()

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email:    z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, email, password } = c.req.valid('json')

  // Drizzle syntax — not Prisma
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) throw new ValidationError('Email already in use')

  const hashed = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({ username, email, password: hashed })  // role/notified use column defaults
    .returning()

  await createSession(c, { userId: user.id, email: user.email, roleId: user.role })

  return c.json({ user: { id: user.id, username: user.username, email: user.email } }, 201)
})

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')

  const valid = await verifyPassword(password, user.password)
  if (!valid) throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')

  await createSession(c, { userId: user.id, email: user.email, role: user.role })

  return c.json({ user: { id: user.id, username: user.username, email: user.email } })
})

auth.post('/logout', (c) => {
  clearSession(c)
  return c.json({ ok: true })
})

auth.get('/me', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ user: null })

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) })
  if (!user) return c.json({ user: null })

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      notified: user.notified,
      description: user.description,
    }
  })
})

// ── Questions ──────────────────────────────────────────────────────────────

forums.get('/recent', async (c) => {
  const limit = Number(c.req.query('limit') ?? 20)
  return c.json(await getRecentQuestions(limit))
})

forums.get('/top', async (c) => {
  const limit = Number(c.req.query('limit') ?? 10)
  return c.json(await getMostViewedQuestions(limit))
})

forums.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const question = await getQuestionById(id)
  if (!question) return c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404)
  return c.json(question)
})

forums.post('/', requireAuth, zValidator('json', z.object({
  title:   z.string().min(3).max(200),
  content: z.string().optional(),
  tagId:   z.number().int().optional(),
})), async (c) => {
  const session = await getSession(c)
  const body    = c.req.valid('json')
  const q = await createQuestion({ userId: session!.userId, ...body })
  return c.json(q, 201)
})

forums.delete('/:id', requireAuth, async (c) => {
  const session    = await getSession(c)
  const id         = Number(c.req.param('id'))
  const question   = await getQuestionById(id)
  if (!question) return c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404)

  const isOwner = question.authorId === session!.userId
  const canDelete = session!.canDeleteReply   // reuse permission — admins/support can delete

  if (!isOwner && !canDelete) throw new ForbiddenError('Cannot delete this post')
  await deleteQuestion(id)
  return c.json({ ok: true })
})

// ── Replies ────────────────────────────────────────────────────────────────

forums.get('/:id/replies', async (c) => {
  const questionId = Number(c.req.param('id'))
  return c.json(await getRepliesForQuestion(questionId))
})

forums.post('/:id/replies', requireAuth, zValidator('json', z.object({
  content: z.string().min(1),
})), async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  const { content } = c.req.valid('json')
  const r = await createReply({ questionId, userId: session!.userId, content })
  return c.json(r, 201)
})

forums.delete('/replies/:replyId', requireAuth, async (c) => {
  const session = await getSession(c)
  // Only admins/support (canDeleteReply) or the author can delete
  // For simplicity we check canDeleteReply from session — extend if you need author check
  if (!session!.canDeleteReply) throw new ForbiddenError('Cannot delete replies')
  await deleteReply(Number(c.req.param('replyId')))
  return c.json({ ok: true })
})

// ── Tags ───────────────────────────────────────────────────────────────────

forums.get('/tags', async (c) => {
  return c.json(await getAllTags())
})

forums.post('/tags', requireAuth, zValidator('json', z.object({
  name:  z.string().min(1),
  short: z.string().max(10).optional(),
  color: z.string().optional(),
})), async (c) => {
  const session = await getSession(c)
  if (!session!.canDeleteReply) throw new ForbiddenError('Admins only')
  const t = await createTag(c.req.valid('json'))
  return c.json(t, 201)
})

export { forums }

export { auth }