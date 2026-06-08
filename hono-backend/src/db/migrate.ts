// npm run db:migrate

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const sqlite = new Database('app.db')
const db = drizzle(sqlite)

// kurva picus sprosty sqlite
try {
  sqlite.pragma('foreign_keys = OFF')

  migrate(db, { migrationsFolder: './drizzle' })
  console.log('migration successful :d')
} catch (err) {
  console.error('migration failed successfully :{ :', err) // KOOOKOOOOOOOT IMIGRANTSKE KLUCE FOREIGN
  process.exit(1)
} finally {
  sqlite.pragma('foreign_keys = ON')
  sqlite.close()
}