import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError, ForbiddenError } from '../auth/errors.js'
import { getUserById, updateUserDescription } from '../db/controllers/users.js'
import { db, userFollows } from '../db/index.js'
import { notifyUserFollow } from '../db/controllers/notifications.js'

const usersRoute = new Hono()

// GET /users/:id
usersRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const user = await getUserById(id)
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

  const [followingCount] = await db
    .select({ count: db.$count(userFollows, eq(userFollows.followerId, id)) })
    .from(userFollows)
    .where(eq(userFollows.followerId, id))

  const [followersCount] = await db
    .select({ count: db.$count(userFollows, eq(userFollows.followingId, id)) })
    .from(userFollows)
    .where(eq(userFollows.followingId, id))

  return c.json({
    id:          user.id,
    username:    user.username,
    description: user.description,
    createdAt:   user.createdAt,
    roleId:      user.roleId,
    roleName:    user.roleName,
    roleColor:   user.roleColor,
    following:   followingCount?.count ?? 0,
    followers:   followersCount?.count ?? 0,
  })
})

// PATCH /users/:id — update own profile
usersRoute.patch('/:id', requireAuth, zValidator('json', z.object({
  description: z.string().max(1000).optional(),
})), async (c) => {
  const session  = await getSession(c)
  const targetId = Number(c.req.param('id'))
  if (isNaN(targetId)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  if (session!.userId !== targetId && session!.roleName !== 'admin')
    throw new ForbiddenError('You can only edit your own profile')

  const { description } = c.req.valid('json')
  if (description !== undefined) await updateUserDescription(targetId, description)

  return c.json({ ok: true })
})

// POST /users/:id/follow — follow/unfollow a user
usersRoute.post('/:id/follow', requireAuth, async (c) => {
  const session    = await getSession(c)
  const targetId   = Number(c.req.param('id'))
  if (isNaN(targetId)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
  if (targetId === session!.userId) throw new AppError('Cannot follow yourself', 400, 'INVALID')

  const existing = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, session!.userId), eq(userFollows.followingId, targetId)))

  if (existing.length) {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, session!.userId), eq(userFollows.followingId, targetId)))
    return c.json({ following: false })
  } else {
    await db.insert(userFollows).values({ followerId: session!.userId, followingId: targetId })
    const me = await getUserById(session!.userId)
    await notifyUserFollow(targetId, session!.userId, me!.username)
    return c.json({ following: true })
  }
})

// GET /users/:id/is-following — check if current user follows target
usersRoute.get('/:id/is-following', requireAuth, async (c) => {
  const session  = await getSession(c)
  const targetId = Number(c.req.param('id'))
  const rows     = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, session!.userId), eq(userFollows.followingId, targetId)))
  return c.json({ following: rows.length > 0 })
})

export { usersRoute }