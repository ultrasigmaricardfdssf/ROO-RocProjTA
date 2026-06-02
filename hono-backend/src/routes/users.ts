import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError, ForbiddenError } from '../auth/errors.js'
import { getUserById, updateUserDescription } from '../db/controllers/users.js'

const usersRoute = new Hono()

usersRoute.get('/:id', async (c) => {
  const id   = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const user = await getUserById(id)
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

  return c.json({
    id:          user.id,
    username:    user.username,
    description: user.description,
    createdAt:   user.createdAt,
    roleId:      user.roleId,
    roleName:    user.roleName,
    roleColor:   user.roleColor,
    following:   0,
    followers:   0,
  })
})

usersRoute.patch('/:id', requireAuth, zValidator('json', z.object({
  description: z.string().max(1000).optional(),
})), async (c) => {
  const session  = await getSession(c)
  const targetId = Number(c.req.param('id'))
  if (isNaN(targetId)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const isOwner = session!.userId === targetId
  const isAdmin = session!.roleName === 'admin'
  if (!isOwner && !isAdmin) throw new ForbiddenError('You can only edit your own profile')

  const { description } = c.req.valid('json')

  if (description !== undefined) {
    await updateUserDescription(targetId, description)
  }

  const updated = await getUserById(targetId)
  return c.json({ ok: true, user: updated })
})

export { usersRoute }