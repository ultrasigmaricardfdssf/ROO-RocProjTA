import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError, ForbiddenError } from '../auth/errors.js'
import {
  getOpenTickets, getTicketsByUser, getTicketById,
  createTicket, resolveTicket,
  getRepliesForTicket, createTicketReply,
} from '../db/controllers/tickets.js'
import { notifyTicketReply, notifyTicketResolved } from '../db/controllers/notifications.js'
import { getUserById } from '../db/controllers/users.js'
import { ticketPriorities, db } from '../db/index.js'

const ticketsRoute = new Hono()

// ── Tickets ────────────────────────────────────────────────────────────────

ticketsRoute.get('/open', requireAuth, async (c) => {
  const session = await getSession(c)
  if (!session!.canAcceptTicket) throw new ForbiddenError('Support/admin only')
  return c.json(await getOpenTickets())
})

// GET /tickets/mine — own tickets
ticketsRoute.get('/mine', requireAuth, async (c) => {
  const session = await getSession(c)
  return c.json(await getTicketsByUser(session!.userId))
})

ticketsRoute.get('/priorities', async (c) => {
  const priorities = await db.select().from(ticketPriorities)
  return c.json(priorities)
})

ticketsRoute.get('/:id', requireAuth, async (c) => {
  const session = await getSession(c)
  const id      = Number(c.req.param('id'))
  const ticket  = await getTicketById(id)
  if (!ticket) throw new AppError('Not found', 404, 'NOT_FOUND')

  // Only requester or support/admin can view
  if (ticket.requesterId !== session!.userId && !session!.canAcceptTicket)
    throw new ForbiddenError('Access denied')

  const replies = await getRepliesForTicket(id)
  return c.json({ ...ticket, replies })
})

// POST /tickets — create ticket
ticketsRoute.post('/', requireAuth, zValidator('json', z.object({
  subject:     z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  priorityId:  z.number().int().optional(),
})), async (c) => {
  const session = await getSession(c)
  if (!session!.canPostTicket) throw new ForbiddenError('You cannot post tickets')

  const t = await createTicket({ requesterId: session!.userId, ...c.req.valid('json') })
  return c.json(t, 201)
})

// POST /tickets/:id/resolve — support/admin resolves a ticket
ticketsRoute.post('/:id/resolve', requireAuth, async (c) => {
  const session = await getSession(c)
  if (!session!.canAcceptTicket) throw new ForbiddenError('Support/admin only')

  const id     = Number(c.req.param('id'))
  const ticket = await getTicketById(id)
  if (!ticket) throw new AppError('Not found', 404, 'NOT_FOUND')

  const resolved = await resolveTicket(id, session!.userId)
  await notifyTicketResolved(ticket.requesterId, session!.userId, id, ticket.subject)

  return c.json(resolved)
})

// ── Replies ────────────────────────────────────────────────────────────────

// POST /tickets/:id/replies
ticketsRoute.post('/:id/replies', requireAuth, zValidator('json', z.object({
  content: z.string().min(1).max(5000),
})), async (c) => {
  const session = await getSession(c)
  const id      = Number(c.req.param('id'))
  const ticket  = await getTicketById(id)
  if (!ticket) throw new AppError('Not found', 404, 'NOT_FOUND')

  // Only requester or support/admin can reply
  if (ticket.requesterId !== session!.userId && !session!.canAcceptTicket)
    throw new ForbiddenError('Access denied')

  const r    = await createTicketReply({ ticketId: id, userId: session!.userId, content: c.req.valid('json').content })
  const user = await getUserById(session!.userId)

  // Notify ticket owner (if support is replying) or support (if user is replying)
  if (ticket.requesterId !== session!.userId) {
    await notifyTicketReply(ticket.requesterId, session!.userId, id, user!.username, ticket.subject)
  }

  return c.json(r, 201)
})

export { ticketsRoute }