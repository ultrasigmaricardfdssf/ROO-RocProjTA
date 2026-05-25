import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'
import { users } from './users.js'

export const tickets = sqliteTable('ticket', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  priorityId: integer('priority_id').notNull().references(() => ticketPriorities.id),
  requesterId: integer('requester_id').notNull().references(() => users.id),
  subject: text('subject').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedBy: integer('resolved_by').references(() => users.id)
})

export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert

export const ticketPriorities = sqliteTable('ticketPriority', {
  id : integer('id').primaryKey({ autoIncrement: true }),
  color : text('color').default('#AAAAAA'),
  name: text('name').notNull()
})

export type TicketPriority = typeof ticketPriorities.$inferSelect
export type NewTicketPriority = typeof ticketPriorities.$inferInsert

export const ticketReplies = sqliteTable('ticketReply', {
  id : integer('id').primaryKey({ autoIncrement: true }),
  ticketId : integer('ticket_id').notNull().references(() => tickets.id),
  userId : integer('user_id').notNull().references(() => users.id),
  content : text('content').notNull(),
  createdAt : integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

export type TicketReply = typeof ticketReplies.$inferSelect
export type NewTicketReply = typeof ticketReplies.$inferInsert