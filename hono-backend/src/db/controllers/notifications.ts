import { eq, desc, and } from 'drizzle-orm'
import { db, notifications, users } from '../index.js'
import type { NewNotification } from '../schemas/notifications.js'

// ── Read ───────────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId: number, limit = 50) {
  return db
    .select({
      id:           notifications.id,
      type:         notifications.type,
      message:      notifications.message,
      read:         notifications.read,
      refId:        notifications.refId,
      refType:      notifications.refType,
      createdAt:    notifications.createdAt,
      fromUserId:   notifications.fromUserId,
      fromUsername: users.username,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

export async function getUnreadCount(userId: number): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return rows.length
}

// ── Write ──────────────────────────────────────────────────────────────────

export async function createNotification(data: Omit<NewNotification, 'id' | 'read' | 'createdAt'>) {
  const [n] = await db.insert(notifications).values(data).returning()
  return n
}

// Mark one as read
export async function markRead(notificationId: number) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId))
}

// Mark all as read for a user
export async function markAllRead(userId: number) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId))
}

// ── Convenience creators — call these from routes when events happen ───────

export async function notifyForumReply(
  questionAuthorId: number,
  fromUserId: number,
  questionId: number,
  fromUsername: string,
  questionTitle: string,
) {
  if (questionAuthorId === fromUserId) return // don't notify yourself
  return createNotification({
    userId:     questionAuthorId,
    fromUserId,
    type:       'forum_reply',
    refId:      questionId,
    refType:    'question',
    message:    `${fromUsername} replied to your question "${questionTitle}"`,
  })
}

export async function notifyFollowers(
  followers: number[],
  fromUserId: number,
  questionId: number,
  fromUsername: string,
  questionTitle: string,
) {
  // Notify all followers except the one who posted
  const targets = followers.filter(id => id !== fromUserId)
  await Promise.all(targets.map(userId =>
    createNotification({
      userId,
      fromUserId,
      type:    'forum_follow_reply',
      refId:   questionId,
      refType: 'question',
      message: `${fromUsername} replied to "${questionTitle}" which you follow`,
    })
  ))
}

export async function notifyReplyReaction(
  replyAuthorId: number,
  fromUserId: number,
  questionId: number,
  fromUsername: string,
) {
  if (replyAuthorId === fromUserId) return
  return createNotification({
    userId:     replyAuthorId,
    fromUserId,
    type:       'reply_reaction',
    refId:      questionId,
    refType:    'question',
    message:    `${fromUsername} liked your reply`,
  })
}

export async function notifyQuestionReaction(
  questionAuthorId: number,
  fromUserId: number,
  questionId: number,
  fromUsername: string,
  questionTitle: string,
) {
  if (questionAuthorId === fromUserId) return
  return createNotification({
    userId:     questionAuthorId,
    fromUserId,
    type:       'forum_reaction',
    refId:      questionId,
    refType:    'question',
    message:    `${fromUsername} liked your question "${questionTitle}"`,
  })
}

export async function notifyReplyMarkedSolution(
  replyAuthorId: number,
  fromUserId: number,
  questionId: number,
  questionTitle: string,
) {
  if (replyAuthorId === fromUserId) return
  return createNotification({
    userId:     replyAuthorId,
    fromUserId,
    type:       'reply_solution',
    refId:      questionId,
    refType:    'question',
    message:    `Your reply was marked as the solution to "${questionTitle}"`,
  })
}

export async function notifyTicketReply(
  ticketOwnerId: number,
  fromUserId: number,
  ticketId: number,
  fromUsername: string,
  ticketSubject: string,
) {
  if (ticketOwnerId === fromUserId) return
  return createNotification({
    userId:     ticketOwnerId,
    fromUserId,
    type:       'ticket_reply',
    refId:      ticketId,
    refType:    'ticket',
    message:    `${fromUsername} replied to your ticket "${ticketSubject}"`,
  })
}

export async function notifyTicketResolved(
  ticketOwnerId: number,
  fromUserId: number,
  ticketId: number,
  ticketSubject: string,
) {
  return createNotification({
    userId:     ticketOwnerId,
    fromUserId,
    type:       'ticket_resolved',
    refId:      ticketId,
    refType:    'ticket',
    message:    `Your ticket "${ticketSubject}" was resolved`,
  })
}

export async function notifyUserFollow(
  targetUserId: number,
  fromUserId: number,
  fromUsername: string,
) {
  if (targetUserId === fromUserId) return
  return createNotification({
    userId:     targetUserId,
    fromUserId,
    type:       'user_follow',
    refId:      fromUserId,
    refType:    'user',
    message:    `${fromUsername} started following you`,
  })
}