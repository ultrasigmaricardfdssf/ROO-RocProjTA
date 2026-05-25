import type { Context, Next } from 'hono'
import { getSession } from './session.js'
import { AuthError, ForbiddenError } from './errors.js'

export async function withSession(c: Context, next: Next) {
  const session = await getSession(c)
  c.set('session', session)
  await next()
}

export async function requireAuth(c: Context, next: Next) {
  const session = await getSession(c)
  if (!session) throw new AuthError('You must be logged in', 'NOT_AUTHENTICATED')
  c.set('session', session)
  await next()
}

export async function requireAdmin(c: Context, next: Next) {
  const session = await getSession(c)
  if (!session) throw new AuthError('You must be logged in', 'NOT_AUTHENTICATED')
  if (session.role !== 'admin') throw new ForbiddenError('Admins only')
  c.set('session', session)
  await next()
}

export function requireOwnerOrAdmin(getTargetUserId: (c: Context) => string | undefined) {
  return async (c: Context, next: Next) => {
    const session = await getSession(c)
    if (!session) throw new AuthError('You must be logged in', 'NOT_AUTHENTICATED')

    const targetId = getTargetUserId(c)
    if (!targetId) throw new ForbiddenError('Missing resource ID')

    const isOwner = session.userId === targetId
    const isAdmin = session.role === 'admin'

    if (!isOwner && !isAdmin) throw new ForbiddenError('You can only edit your own profile')

    c.set('session', session)
    await next()
  }
}