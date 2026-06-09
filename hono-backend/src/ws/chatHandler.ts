import type { WebSocket } from 'ws'
import { eq } from 'drizzle-orm'
import { db, chatRooms } from '../db/index.js'

export interface ChatMessage {
  id:       string     // uuid-lite — just Date.now() + random
  userId:   number
  username: string
  text:     string
  sentAt:   string     // ISO string
}

export interface RoomMember {
  userId:   number
  username: string
  ws:       WebSocket
}

interface ActiveRoom {
  id:       number
  title:    string
  members:  Map<number, RoomMember>   // userId → member
  messages: ChatMessage[]
  closeTimer: ReturnType<typeof setTimeout> | null
}

// In-memory room state — lives for the duration of the server process
const activeRooms = new Map<number, ActiveRoom>()

function msgId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Broadcast helpers ──────────────────────────────────────────────────────

function broadcast(room: ActiveRoom, payload: object, excludeUserId?: number) {
  const data = JSON.stringify(payload)
  for (const member of room.members.values()) {
    if (member.userId === excludeUserId) continue
    if (member.ws.readyState === 1 /* OPEN */) {
      member.ws.send(data)
    }
  }
}

function sendTo(ws: WebSocket, payload: object) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload))
}

// ── Room lifecycle ─────────────────────────────────────────────────────────

function memberList(room: ActiveRoom) {
  return Array.from(room.members.values()).map(m => ({ userId: m.userId, username: m.username }))
}

async function closeRoom(roomId: number) {
  const room = activeRooms.get(roomId)
  if (!room) return

  const log = JSON.stringify(room.messages)

  await db
    .update(chatRooms)
    .set({ active: false, closedAt: new Date(), log })
    .where(eq(chatRooms.id, roomId))

  activeRooms.delete(roomId)
  console.log(`[chat] Room ${roomId} "${room.title}" closed — ${room.messages.length} messages saved`)
}

function scheduleClose(room: ActiveRoom) {
  if (room.closeTimer) clearTimeout(room.closeTimer)
  room.closeTimer = setTimeout(() => {
    if (room.members.size === 0) closeRoom(room.id)
  }, 8000) // showcase, defautl is 8sex (would prob bump to 30)
}

function cancelClose(room: ActiveRoom) {
  if (room.closeTimer) {
    clearTimeout(room.closeTimer)
    room.closeTimer = null
  }
}

// ── Join ───────────────────────────────────────────────────────────────────

export async function handleJoin(
  ws: WebSocket,
  roomId: number,
  userId: number,
  username: string,
) {
  // Load room from DB if not in memory yet
  if (!activeRooms.has(roomId)) {
    const [row] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, roomId))

    if (!row || !row.active) {
      sendTo(ws, { type: 'error', code: 'ROOM_CLOSED', message: 'This room is no longer active.' })
      ws.close()
      return
    }

    activeRooms.set(roomId, {
      id:       row.id,
      title:    row.title,
      members:  new Map(),
      messages: [],
      closeTimer: null,
    })
  }

  const room = activeRooms.get(roomId)!
  cancelClose(room)

  // Replace existing connection if user reconnects
  const existing = room.members.get(userId)
  if (existing) existing.ws.close()

  room.members.set(userId, { userId, username, ws })

  // Send room state to the joining user
  sendTo(ws, {
    type:     'init',
    roomId:   room.id,
    title:    room.title,
    messages: room.messages,
    members:  memberList(room),
  })

  // Notify everyone else
  broadcast(room, {
    type:     'member_join',
    userId,
    username,
    members:  memberList(room),
  }, userId)

  // ── Message handler ────────────────────────────────────────────────────

  ws.on('message', (raw) => {
    let parsed: any
    try { parsed = JSON.parse(raw.toString()) } catch { return }

    if (parsed.type === 'message') {
      const text = String(parsed.text ?? '').trim().slice(0, 2000)
      if (!text) return

      const msg: ChatMessage = {
        id:       msgId(),
        userId,
        username,
        text,
        sentAt:   new Date().toISOString(),
      }

      room.messages.push(msg)

      // Broadcast to everyone including sender (sender needs their own message confirmed)
      broadcast(room, { type: 'message', message: msg })
    }

    if (parsed.type === 'leave') {
      ws.close()
    }
  })

  // ── Disconnect handler ─────────────────────────────────────────────────

  ws.on('close', () => {
    room.members.delete(userId)

    broadcast(room, {
      type:    'member_leave',
      userId,
      username,
      members: memberList(room),
    })

    if (room.members.size === 0) {
      scheduleClose(room)
    }
  })

  ws.on('error', () => {
    room.members.delete(userId)
    if (room.members.size === 0) scheduleClose(room)
  })
}

// ── Exported utils for HTTP routes ─────────────────────────────────────────

export function getActiveMemberCount(roomId: number): number {
  return activeRooms.get(roomId)?.members.size ?? 0
}

export function isRoomInMemory(roomId: number): boolean {
  return activeRooms.has(roomId)
}