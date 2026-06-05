import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const userRoles = sqliteTable('userRole', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  name:            text('name').notNull(),
  color:           text('color').default('#AAAAAA'),
  canAsk:          integer('canAsk', { mode: 'boolean' }).notNull().default(true), 
  canReply:        integer('canReply',        { mode: 'boolean' }).notNull().default(true),
  canDeleteReply:  integer('canDeleteReply',  { mode: 'boolean' }).notNull().default(false),
  canPostTicket:   integer('canPostTicket',   { mode: 'boolean' }).notNull().default(false),
  canAcceptTicket: integer('canAcceptTicket', { mode: 'boolean' }).notNull().default(false),
})

export type UserRole    = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert

export const users = sqliteTable('users', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  username:    text('username').notNull().unique(),
  email:       text('email').notNull().unique(),
  password:    text('password').notNull(),
  roleId:      integer('role_id').notNull().references(() => userRoles.id).default(1),
  notified:    integer('notified',    { mode: 'boolean' }).notNull().default(true),
  description: text('description'),
  createdAt:   integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// User follows another user
export const userFollows = sqliteTable('userFollow', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  followerId:  integer('follower_id').notNull().references(() => users.id),
  followingId: integer('following_id').notNull().references(() => users.id),
  createdAt:   integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type UserFollow    = typeof userFollows.$inferSelect
export type NewUserFollow = typeof userFollows.$inferInsert