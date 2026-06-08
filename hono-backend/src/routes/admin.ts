import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, sql, like, or } from 'drizzle-orm'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError, ForbiddenError } from '../auth/errors.js'
import { db, users, userRoles, questions, replies, tickets, ticketReplies } from '../db/index.js'
import { deleteQuestion, deleteReply } from '../db/controllers/questions.js'
import { getAllRoles } from '../db/controllers/users.js'
import { hashPassword } from '../auth/password.js'

const admin = new Hono()

// All admin routes require admin role
admin.use('*', requireAuth, async (c, next) => {
  const session = await getSession(c)
  if (session!.roleName !== 'admin') throw new ForbiddenError('Admin only')
  await next()
})

// ── Stats ──────────────────────────────────────────────────────────────────

admin.get('/stats', async (c) => {
  const [[userCount], [questionCount], [replyCount], [ticketCount], [openTicketCount]] =
    await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(users),
      db.select({ count: sql<number>`COUNT(*)` }).from(questions),
      db.select({ count: sql<number>`COUNT(*)` }).from(replies),
      db.select({ count: sql<number>`COUNT(*)` }).from(tickets),
      db.select({ count: sql<number>`COUNT(*)` }).from(tickets).where(sql`resolved_at IS NULL`),
    ])

  return c.json({
    users:       userCount.count,
    questions:   questionCount.count,
    replies:     replyCount.count,
    tickets:     ticketCount.count,
    openTickets: openTicketCount.count,
  })
})

// ── User management ────────────────────────────────────────────────────────

// GET /admin/users?q=...&page=...
admin.get('/users', async (c) => {
  const q     = c.req.query('q')?.trim() ?? ''
  const page  = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = 30
  const offset = (page - 1) * limit

  const where = q
    ? or(like(users.username, `%${q}%`), like(users.email, `%${q}%`))
    : undefined

  const rows = await db
    .select({
      id:        users.id,
      username:  users.username,
      email:     users.email,
      createdAt: users.createdAt,
      roleId:    users.roleId,
      roleName:  userRoles.name,
      roleColor: userRoles.color,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.roleId, userRoles.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)

  const [[{ count }]] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(where),
  ])

  return c.json({ users: rows, total: count, page, pages: Math.ceil(count / limit) })
})

// GET /admin/users/:id — full user detail
admin.get('/users/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const [user] = await db
    .select({
      id:          users.id,
      username:    users.username,
      email:       users.email,
      description: users.description,
      notified:    users.notified,
      createdAt:   users.createdAt,
      roleId:      users.roleId,
      roleName:    userRoles.name,
      roleColor:   userRoles.color,
      questionCount: sql<number>`(SELECT COUNT(*) FROM forumQuestion WHERE user_id = ${users.id})`,
      replyCount:    sql<number>`(SELECT COUNT(*) FROM forumReply    WHERE user_id = ${users.id})`,
      ticketCount:   sql<number>`(SELECT COUNT(*) FROM ticket        WHERE requester_id = ${users.id})`,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.roleId, userRoles.id))
    .where(eq(users.id, id))

  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
  return c.json(user)
})

// PATCH /admin/users/:id/role
admin.patch('/users/:id/role', zValidator('json', z.object({
  roleId: z.number().int().min(1),
})), async (c) => {
  const session = await getSession(c)
  const id      = Number(c.req.param('id'))
  if (id === session!.userId) throw new AppError('Cannot change your own role', 400, 'INVALID')

  const { roleId } = c.req.valid('json')
  const [updated] = await db
    .update(users).set({ roleId }).where(eq(users.id, id)).returning()

  if (!updated) throw new AppError('User not found', 404, 'NOT_FOUND')
  return c.json({ ok: true })
})

// PATCH /admin/users/:id/password — force reset
admin.patch('/users/:id/password', zValidator('json', z.object({
  password: z.string().min(8),
})), async (c) => {
  const id     = Number(c.req.param('id'))
  const hashed = await hashPassword(c.req.valid('json').password)
  await db.update(users).set({ password: hashed }).where(eq(users.id, id))
  return c.json({ ok: true })
})

// DELETE /admin/users/:id
admin.delete('/users/:id', async (c) => {
  const session = await getSession(c)
  const id      = Number(c.req.param('id'))
  if (id === session!.userId) throw new AppError('Cannot delete yourself', 400, 'INVALID')
  await db.delete(users).where(eq(users.id, id))
  return c.json({ ok: true })
})

// ── Roles ──────────────────────────────────────────────────────────────────

admin.get('/roles', async (c) => {
  return c.json(await getAllRoles())
})

admin.post('/roles', zValidator('json', z.object({
  name:            z.string().min(1),
  color:           z.string().optional(),
  canReply:        z.boolean().default(true),
  canDeleteReply:  z.boolean().default(false),
  canPostTicket:   z.boolean().default(false),
  canAcceptTicket: z.boolean().default(false),
})), async (c) => {
  const [role] = await db.insert(userRoles).values(c.req.valid('json')).returning()
  return c.json(role, 201)
})

admin.patch('/roles/:id', zValidator('json', z.object({
  name:            z.string().min(1).optional(),
  color:           z.string().optional(),
  canReply:        z.boolean().optional(),
  canDeleteReply:  z.boolean().optional(),
  canPostTicket:   z.boolean().optional(),
  canAcceptTicket: z.boolean().optional(),
})), async (c) => {
  const id = Number(c.req.param('id'))
  const [updated] = await db
    .update(userRoles).set(c.req.valid('json')).where(eq(userRoles.id, id)).returning()
  if (!updated) throw new AppError('Role not found', 404, 'NOT_FOUND')
  return c.json(updated)
})

// ── Content moderation ─────────────────────────────────────────────────────

// GET /admin/content/questions?q=...&page=...
admin.get('/content/questions', async (c) => {
  const q      = c.req.query('q')?.trim() ?? ''
  const page   = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit  = 30
  const offset = (page - 1) * limit
  const where  = q ? like(questions.title, `%${q}%`) : undefined

  const rows = await db
    .select({
      id:         questions.id,
      title:      questions.title,
      createdAt:  questions.createdAt,
      authorId:   users.id,
      authorName: users.username,
      replyCount: sql<number>`(SELECT COUNT(*) FROM forumReply WHERE question_id = ${questions.id})`,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .where(where)
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset(offset)

  const [[{ count }]] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(questions).where(where),
  ])

  return c.json({ questions: rows, total: count, page, pages: Math.ceil(count / limit) })
})

// DELETE /admin/content/questions/:id
admin.delete('/content/questions/:id', async (c) => {
  await deleteQuestion(Number(c.req.param('id')))
  return c.json({ ok: true })
})

// DELETE /admin/content/replies/:id
admin.delete('/content/replies/:id', async (c) => {
  await deleteReply(Number(c.req.param('id')))
  return c.json({ ok: true })
})

// GET /admin/content/tickets?page=...
admin.get('/content/tickets', async (c) => {
  const page   = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit  = 30
  const offset = (page - 1) * limit

  const rows = await db
    .select({
      id:           tickets.id,
      subject:      tickets.subject,
      createdAt:    tickets.createdAt,
      resolvedAt:   tickets.resolvedAt,
      requesterName: users.username,
      requesterId:  tickets.requesterId
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.requesterId, users.id))
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset)

  const [[{ count }]] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(tickets),
  ])

  return c.json({ tickets: rows, total: count, page, pages: Math.ceil(count / limit) })
})

// DELETE /admin/content/tickets/:id
admin.delete('/content/tickets/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(ticketReplies).where(eq(ticketReplies.ticketId, id))
  await db.delete(tickets).where(eq(tickets.id, id))
  return c.json({ ok: true })
})

export { admin }