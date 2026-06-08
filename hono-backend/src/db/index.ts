// npx drizzle-kit studio
    // fireass thing, fuck you Juraj Novák from 2024 ur web viewer sucks
// npm run db:generate
// npm run db:migrate
// npm run db:seed (if theres new default roles or whatev)

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as userSchema     from './schemas/users.js'
import * as questionSchema from './schemas/questions.js'
import * as ticketSchema   from './schemas/tickets.js'
import * as notifSchema    from './schemas/notifications.js'
import * as chatSchema from './schemas/chatlogs.js'

const schema = { ...userSchema, ...questionSchema, ...ticketSchema, ...notifSchema, ...chatSchema }

const sqlite = new Database('app.db')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema }) // drizzle deez
export type DB  = typeof db

export * from './schemas/users.js'
export * from './schemas/questions.js'
export * from './schemas/tickets.js'
export * from './schemas/notifications.js'
export * from './schemas/chatlogs.js'