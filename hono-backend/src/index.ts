import { Hono } from 'hono'
import { auth } from './auth/routes.js'
import { requireAuth, requireOwnerOrAdmin } from './auth/middleware.js'
import { AppError } from './auth/errors.js'

const app = new Hono()

// Global error handler — converts thrown errors to clean JSON
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { message: err.message, code: err.code } }, err.statusCode as any)
  }
  console.error(err)
  return c.json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } }, 500)
})

// Auth routes (public)
app.route('/auth', auth)

// Protected: any logged-in user
app.get('/posts', requireAuth, async (c) => {
  // ...
})

// Protected: owner or admin only
app.put(
  '/users/:id/profile',
  requireOwnerOrAdmin((c) => c.req.param('id')),
  async (c) => {
    // ...
  }
)

export default app