import type { Context, Next } from 'hono'
import { authService } from './auth.service.js'

export const requireAuth = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  try {
    const payload = authService.verifyToken(token)

    // attach user to context
    c.set('user', payload)

    await next()
  } catch {
    return c.json({ message: 'Invalid token' }, 401)
  }
}