import { sqliteTable, text, integer, boolean } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: integer('role').notNull().default(0),
  notified: integer('notified', { mode: 'boolean' }).notNull().default(true),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const userRoles = sqliteTable('userRole', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  color: text('color').default('#AAAAAA'),
  canReply: integer('canReply', { mode: 'boolean' }).notNull().default(true), // huhhhhhh
  canDeleteReply: integer('canDeleteReply', { mode: 'boolean' }).notNull().default(false), // huhhhhhh
  canPostTicket: integer('canPostTicket', { mode: 'boolean' }).notNull().default(false), // huhhhhhh
  canAcceptTicket: integer('canAcceptTicket', { mode: 'boolean' }).notNull().default(false), // huhhhhhh thansk intellisense
})

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert