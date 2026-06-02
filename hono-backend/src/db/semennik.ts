// npm run db:seed

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as userSchema     from './schemas/users.js'
import * as ticketSchema   from './schemas/tickets.js'
import * as questionSchema from './schemas/questions.js';

const sqlite = new Database('app.db')
sqlite.pragma('foreign_keys = ON')
const db = drizzle(sqlite, { schema: { ...userSchema, ...ticketSchema } })

// roles
await db.insert(userSchema.userRoles).values([
  { id: 1, name: 'user',    color: '#6366f1', canReply: true,  canDeleteReply: false, canPostTicket: true,  canAcceptTicket: false },
  { id: 2, name: 'support', color: '#f59e0b', canReply: true,  canDeleteReply: false,  canPostTicket: true,  canAcceptTicket: true  },
  { id: 3, name: 'admin',   color: '#ef4444', canReply: true,  canDeleteReply: true,  canPostTicket: true,  canAcceptTicket: true  },
]).onConflictDoNothing()

// ticket priorityies
await db.insert(ticketSchema.ticketPriorities).values([
  { id: 1, name: 'low',      color: '#22c55e' },
  { id: 2, name: 'medium',   color: '#f59e0b' },
  { id: 3, name: 'high',     color: '#ef4444' },
  { id: 4, name: 'critical', color: '#7c3aed' },
]).onConflictDoNothing()

// forum question tags
await db.insert(questionSchema.questionTags).values([
  { id: 1, name: 'Unknown', short: 'UNKW' },
  { id: 2, name: 'General', short: 'GNRL' },
  { id: 3, name: 'Windows', short: 'WNDW' },
  { id: 4, name: 'Linux', short: 'LNUX' },
  { id: 5, name: 'Electrotechnics', short: 'LTCH' },
  { id: 6, name: 'Unrelated', short: 'URLT' },
  { id: 7, name: 'Prank', short: 'PRNK' },
  { id: 8, name: 'C#', short: 'C#' },
  { id: 9, name: 'Lua', short: 'LUA' },
  { id: 10, name: 'Web', short: 'WEB' },
]).onConflictDoNothing()

console.log('im seeding it successfully')
sqlite.close() // bye bye