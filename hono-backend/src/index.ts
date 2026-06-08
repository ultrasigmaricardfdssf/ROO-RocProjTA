import { Hono } from 'hono'
import { auth } from './auth/routes.js'
import { search } from './routes/search.js'
import { forums }             from './routes/forums.js'
import { ticketsRoute }       from './routes/tickets.js'
import { notificationsRoute } from './routes/notifications.js'
import { usersRoute }         from './routes/users.js'
import { admin } from './routes/admin.js'
import { requireAuth, requireOwnerOrAdmin } from './auth/middleware.js'
import { AppError } from './auth/errors.js'
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { chat, registerWsRoutes } from './routes/chat.js'

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
app.route('/notifications', notificationsRoute)
app.route('/tickets',       ticketsRoute)
app.route('/search', search)
app.route('/chat', chat)
app.route('/admin', admin);

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

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

registerWsRoutes(app, upgradeWebSocket)

injectWebSocket(serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
}))

export default app