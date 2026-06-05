import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users.js'

/*
  Notification types:
  - 'forum_reply'      → someone replied to your question
  - 'forum_reaction'   → someone liked your question
  - 'reply_reaction'   → someone liked your reply
  - 'reply_solution'   → your reply was marked as solution
  - 'forum_follow_reply' → new reply on a question you follow
  - 'ticket_reply'     → new reply on your ticket
  - 'ticket_resolved'  → your ticket was resolved
  - 'user_follow'      → someone followed you
*/

export const notifications = sqliteTable('notification', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  userId:     integer('user_id').notNull().references(() => users.id),  // recipient
  fromUserId: integer('from_user_id').references(() => users.id),       // who triggered it (null = system)
  type:       text('type').notNull(),
  // Generic reference fields — which entity triggered this
  refId:      integer('ref_id'),        // question id, ticket id, reply id etc
  refType:    text('ref_type'),         // 'question' | 'reply' | 'ticket' | 'user'
  message:    text('message').notNull(),
  read:       integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt:  integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type Notification    = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert