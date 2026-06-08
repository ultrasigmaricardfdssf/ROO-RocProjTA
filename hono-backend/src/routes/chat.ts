import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, like, desc, and } from 'drizzle-orm'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError } from '../auth/errors.js'
import { db, chatRooms } from '../db/index.js'
import { getUserById } from '../db/controllers/users.js'
import { handleJoin, getActiveMemberCount } from '../ws/chatHandler.js'

const chat = new Hono()

// GET /chat — list active rooms (+ member count from memory)
chat.get('/', async (c) => {
  const q     = c.req.query('q')?.trim() ?? ''
  const where = q
    ? and(eq(chatRooms.active, true), like(chatRooms.title, `%${q}%`))
    : eq(chatRooms.active, true)

  const rooms = await db
    .select({
      id:        chatRooms.id,
      title:     chatRooms.title,
      createdAt: chatRooms.createdAt,
    })
    .from(chatRooms)
    .where(where)
    .orderBy(desc(chatRooms.createdAt))

  // Attach live member count from in-memory state
  return c.json(rooms.map(r => ({
    ...r,
    memberCount: getActiveMemberCount(r.id),
  })))
})

// GET /chat/:id — check if a room is still active
chat.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const [room] = await db
    .select()
    .from(chatRooms)
    .where(eq(chatRooms.id, id))

  if (!room)        throw new AppError('Room not found', 404, 'NOT_FOUND')
  if (!room.active) throw new AppError('Room is closed', 410, 'ROOM_CLOSED')

  return c.json({ id: room.id, title: room.title, createdAt: room.createdAt, memberCount: getActiveMemberCount(id) })
})

// POST /chat — create a room
chat.post('/', requireAuth, zValidator('json', z.object({
  title: z.string().min(3).max(80).trim(),
})), async (c) => {
  const session = await getSession(c)
  const { title } = c.req.valid('json')

  // Return existing active room if title is taken
  const [existing] = await db
    .select()
    .from(chatRooms)
    .where(and(eq(chatRooms.title, title), eq(chatRooms.active, true)))

  if (existing) {
    return c.json({ id: existing.id, title: existing.title, existed: true })
  }

  const [room] = await db
    .insert(chatRooms)
    .values({ title, createdBy: session!.userId })
    .returning()

  return c.json({ id: room.id, title: room.title, existed: false }, 201)
})

export function registerWsRoutes(app: any, upgradeWebSocket: Function) {
  app.get('/ws/chat/:id', requireAuth, upgradeWebSocket(async (c: any) => {
    const roomId  = Number(c.req.param('id'))
    const session = await getSession(c)

    if (!session) {
      return {
        onOpen(_evt: any, ws: any) {
          ws.send(JSON.stringify({ type: 'error', code: 'UNAUTHORIZED' }))
          ws.close()
        }
      }
    }

    const user = await getUserById(session.userId)

    return {
      async onOpen(_evt: any, ws: any) {
        // ws.raw is required for @hono/node-ws
        await handleJoin(ws.raw, roomId, session.userId, user?.username ?? 'Unknown')
      },
      onError(err: any) {
        console.error('[ws] error', err)
      },
    }
  }))
}

export { chat }