import { Hono } from 'hono'
import { auth } from './auth/routes.js'
import { forums } from './routes/forums.js'
import { search } from './routes/search.js'
import { usersRoute } from './routes/users.js'
import { requireAuth, requireOwnerOrAdmin } from './auth/middleware.js'
import { AppError } from './auth/errors.js'
import { serve } from '@hono/node-server';

const app = new Hono()

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { message: err.message, code: err.code } }, err.statusCode as any)
  }
  console.error(err)
  return c.json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } }, 500)
})

app.route('/auth', auth)
app.route('/forums', forums)
app.route('/users', usersRoute)
app.route('/search', search)

app.get('/posts', requireAuth, async (c) => {
  // 
})

app.put(
  '/users/:id/profile',
  requireOwnerOrAdmin((c) => c.req.param('id')),
  async (c) => {
    // 
  }
)

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})

export default app