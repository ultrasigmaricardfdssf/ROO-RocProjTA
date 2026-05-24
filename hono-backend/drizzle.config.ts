import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schemas/*',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: 'app.db' },
} satisfies Config