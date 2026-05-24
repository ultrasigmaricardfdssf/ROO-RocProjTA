import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schemas/users.js'
import { hashPassword, verifyPassword } from './password.js'
import { createSession, clearSession, getSession } from './session.js'
import { AuthError, ValidationError } from './errors.js'

const auth = new Hono()

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email:    z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, email, password } = c.req.valid('json')

  // Drizzle syntax — not Prisma
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) throw new ValidationError('Email already in use')

  const hashed = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({ username, email, password: hashed })  // role/notified use column defaults
    .returning()

  await createSession(c, { userId: user.id, email: user.email, role: user.role })

  return c.json({ user: { id: user.id, username: user.username, email: user.email } }, 201)
})

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')

  const valid = await verifyPassword(password, user.password)
  if (!valid) throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')

  await createSession(c, { userId: user.id, email: user.email, role: user.role })

  return c.json({ user: { id: user.id, username: user.username, email: user.email } })
})

auth.post('/logout', (c) => {
  clearSession(c)
  return c.json({ ok: true })
})

auth.get('/me', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ user: null })

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) })
  if (!user) return c.json({ user: null })

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      notified: user.notified,
      description: user.description,
    }
  })
})

export { auth }