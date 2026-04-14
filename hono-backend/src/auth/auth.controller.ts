import type { Context } from 'hono'
import { setCookie } from 'hono/cookie'
import { authService, type User } from './auth.service.js'
import { dbmanager } from '../db-manager.js'

export const login = async (c: Context) => {
  const { email, password } = await c.req.json()

  const user : User | null = dbmanager.users.getUserByEmail(email);

  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  const valid = authService.verify(password, user.password)

  if (!valid) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  const token = authService.generateToken(user.id)

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    path: '/',
  })

  return c.json({ id: user.id, email: user.email })
}