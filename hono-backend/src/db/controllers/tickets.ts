import { eq, isNull, desc } from 'drizzle-orm'
import { db, tickets, ticketReplies, ticketPriorities, users } from '../index.js'

export async function getOpenTickets(limit = 50) {
  return db
    .select({
      id:           tickets.id,
      subject:      tickets.subject,
      description:  tickets.description,
      createdAt:    tickets.createdAt,
      requesterId:  users.id,
      requesterName:users.username,
      priorityId:   ticketPriorities.id,
      priorityName: ticketPriorities.name,
      priorityColor:ticketPriorities.color,
    })
    .from(tickets)
    .leftJoin(users,             eq(tickets.requesterId, users.id))
    .leftJoin(ticketPriorities,  eq(tickets.priorityId,  ticketPriorities.id))
    .where(isNull(tickets.resolvedAt))
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
}

export async function getTicketsByUser(userId: number) {
  return db
    .select({
      id:           tickets.id,
      subject:      tickets.subject,
      description:  tickets.description,
      createdAt:    tickets.createdAt,
      resolvedAt:   tickets.resolvedAt,
      priorityName: ticketPriorities.name,
      priorityColor:ticketPriorities.color,
    })
    .from(tickets)
    .leftJoin(ticketPriorities, eq(tickets.priorityId, ticketPriorities.id))
    .where(eq(tickets.requesterId, userId))
    .orderBy(desc(tickets.createdAt))
}

export async function getTicketById(id: number) {
  const [ticket] = await db
    .select({
      id:           tickets.id,
      subject:      tickets.subject,
      description:  tickets.description,
      createdAt:    tickets.createdAt,
      resolvedAt:   tickets.resolvedAt,
      requesterId:  tickets.requesterId,
      requesterName:users.username,
      priorityName: ticketPriorities.name,
      priorityColor:ticketPriorities.color,
    })
    .from(tickets)
    .leftJoin(users,            eq(tickets.requesterId, users.id))
    .leftJoin(ticketPriorities, eq(tickets.priorityId,  ticketPriorities.id))
    .where(eq(tickets.id, id))

  return ticket ?? null
}

export async function createTicket(data: { requesterId: number; subject: string; description?: string; priorityId?: number }) {
  const [t] = await db
    .insert(tickets)
    .values({ priorityId: 1, ...data })
    .returning()
  return t
}

export async function resolveTicket(id: number, resolvedBy: number) {
  const [t] = await db
    .update(tickets)
    .set({ resolvedAt: new Date(), resolvedBy })
    .where(eq(tickets.id, id))
    .returning()
  return t
}

export async function getRepliesForTicket(ticketId: number) {
  return db
    .select({
      id:         ticketReplies.id,
      content:    ticketReplies.content,
      createdAt:  ticketReplies.createdAt,
      authorId:   users.id,
      authorName: users.username,
    })
    .from(ticketReplies)
    .leftJoin(users, eq(ticketReplies.userId, users.id))
    .where(eq(ticketReplies.ticketId, ticketId))
    .orderBy(ticketReplies.createdAt)
}

export async function createTicketReply(data: { ticketId: number; userId: number; content: string }) {
  const [r] = await db.insert(ticketReplies).values(data).returning()
  return r
}