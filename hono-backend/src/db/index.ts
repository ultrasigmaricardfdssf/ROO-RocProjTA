// npm run db:generate
// npm run db:migrate

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as userSchema     from './schemas/users.js'
import * as questionSchema from './schemas/questions.js'
import * as ticketSchema   from './schemas/tickets.js'
import * as notifSchema    from './schemas/notifications.js'

const schema = { ...userSchema, ...questionSchema, ...ticketSchema, ...notifSchema }

const sqlite = new Database('app.db')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema }) // drizzle deez
export type DB  = typeof db

export * from './schemas/users.js'
export * from './schemas/questions.js'
export * from './schemas/tickets.js'
export * from './schemas/notifications.js'