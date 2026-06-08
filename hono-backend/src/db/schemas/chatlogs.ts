import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users.js'

export const chatRooms = sqliteTable('chatRoom', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  title:     text('title').notNull().unique(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  closedAt:  integer('closed_at',  { mode: 'timestamp' }),
  log:       text('log'),          // JSON string — saved when room closes
  active:    integer('active', { mode: 'boolean' }).notNull().default(true),
})

export type ChatRoom    = typeof chatRooms.$inferSelect
export type NewChatRoom = typeof chatRooms.$inferInsert