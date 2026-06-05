import { Hono } from 'hono'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError } from '../auth/errors.js'
import {
  getNotificationsForUser,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../db/controllers/notifications.js'

const notificationsRoute = new Hono()

// GET /notifications — get all notifications for current user
notificationsRoute.get('/', requireAuth, async (c) => {
  const session = await getSession(c)
  const limit   = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const notifs  = await getNotificationsForUser(session!.userId, limit)
  return c.json(notifs)
})

// GET /notifications/unread-count
notificationsRoute.get('/unread-count', requireAuth, async (c) => {
  const session = await getSession(c)
  const count   = await getUnreadCount(session!.userId)
  return c.json({ count })
})

// PATCH /notifications/:id/read — mark one as read
notificationsRoute.patch('/:id/read', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
  await markRead(id)
  return c.json({ ok: true })
})

// PATCH /notifications/read-all — mark all as read
notificationsRoute.patch('/read-all', requireAuth, async (c) => {
  const session = await getSession(c)
  await markAllRead(session!.userId)
  return c.json({ ok: true })
})

export { notificationsRoute }