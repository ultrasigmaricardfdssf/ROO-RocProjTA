import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'

export const users = sqliteTable('users', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  username:    text('username').notNull().unique(),
  email:       text('email').notNull().unique(),
  password:    text('password').notNull(),
  role:        integer('role').notNull().default(0),
  notified:    integer('notified', { mode: 'boolean' }).notNull().default(true),
  description: text('description'),
  createdAt:   integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert