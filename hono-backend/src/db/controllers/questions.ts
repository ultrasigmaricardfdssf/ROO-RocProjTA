import { eq, desc, sql, and } from 'drizzle-orm'
import {
  db, questions, replies, questionTags, questionReactions,
  replyReactions, questionFollows, users
} from '../index.js'

// ── Questions ──────────────────────────────────────────────────────────────

export async function getRecentQuestions(limit = 20) {
  return db
    .select({
      id:            questions.id,
      title:         questions.title,
      content:       questions.content,
      createdAt:     questions.createdAt,
      viewCount:     questions.viewCount,
      authorId:      users.id,
      authorName:    users.username,
      tagId:         questionTags.id,
      tagName:       questionTags.name,
      tagShort:      questionTags.short,
      tagColor:      questionTags.color,
      replyCount:    sql<number>`(SELECT COUNT(*) FROM forumReply WHERE question_id = ${questions.id})`,
      reactionCount: sql<number>`(SELECT COUNT(*) FROM forumReaction WHERE forum_id = ${questions.id})`,
    })
    .from(questions)
    .leftJoin(users,        eq(questions.userId, users.id))
    .leftJoin(questionTags, eq(questions.tagId,  questionTags.id))
    .orderBy(desc(questions.createdAt))
    .limit(limit)
}

export async function getMostViewedQuestions(limit = 10) {
  return db
    .select({
      id:            questions.id,
      title:         questions.title,
      content:       questions.content,
      createdAt:     questions.createdAt,
      viewCount:     questions.viewCount,
      authorId:      users.id,
      authorName:    users.username,
      tagId:         questionTags.id,
      tagName:       questionTags.name,
      tagShort:      questionTags.short,
      tagColor:      questionTags.color,
      replyCount:    sql<number>`(SELECT COUNT(*) FROM forumReply WHERE question_id = ${questions.id})`,
      reactionCount: sql<number>`(SELECT COUNT(*) FROM forumReaction WHERE forum_id = ${questions.id})`,
    })
    .from(questions)
    .leftJoin(users,        eq(questions.userId, users.id))
    .leftJoin(questionTags, eq(questions.tagId,  questionTags.id))
    .orderBy(desc(questions.viewCount))
    .limit(limit)
}

export async function getQuestionById(id: number) {
  const [question] = await db
    .select({
      id:            questions.id,
      title:         questions.title,
      content:       questions.content,
      createdAt:     questions.createdAt,
      editedAt:      questions.editedAt,
      viewCount:     questions.viewCount,
      authorId:      users.id,
      authorName:    users.username,
      tagId:         questionTags.id,
      tagName:       questionTags.name,
      tagColor:      questionTags.color,
      tagShort:      questionTags.short,
      reactionCount: sql<number>`(SELECT COUNT(*) FROM forumReaction WHERE forum_id = ${questions.id})`,
    })
    .from(questions)
    .leftJoin(users,        eq(questions.userId, users.id))
    .leftJoin(questionTags, eq(questions.tagId,  questionTags.id))
    .where(eq(questions.id, id))
  return question ?? null
}

// Increment view count — call when a question page is opened
export async function incrementViewCount(id: number) {
  await db
    .update(questions)
    .set({ viewCount: sql`${questions.viewCount} + 1` })
    .where(eq(questions.id, id))
}

export async function createQuestion(data: { userId: number; title: string; content?: string; tagId?: number }) {
  const [q] = await db.insert(questions).values(data).returning()
  return q
}

export async function deleteQuestion(id: number) {
  await db.delete(questions).where(eq(questions.id, id))
}

// ── Replies ────────────────────────────────────────────────────────────────

export async function getRepliesForQuestion(questionId: number) {
  return db
    .select({
      id:            replies.id,
      content:       replies.content,
      createdAt:     replies.createdAt,
      isSolution:    replies.isSolution,
      authorId:      users.id,
      authorName:    users.username,
      reactionCount: sql<number>`(SELECT COUNT(*) FROM forumReplyReaction WHERE reply_id = ${replies.id})`,
    })
    .from(replies)
    .leftJoin(users, eq(replies.userId, users.id))
    .where(eq(replies.questionId, questionId))
    .orderBy(replies.createdAt)
}

export async function createReply(data: { questionId: number; userId: number; content: string }) {
  const [r] = await db.insert(replies).values(data).returning()
  return r
}

export async function deleteReply(id: number) {
  await db.delete(replies).where(eq(replies.id, id))
}

export async function setSolutionReply(questionId: number, replyId: number | null) {
  await db
    .update(replies)
    .set({ isSolution: false })
    .where(eq(replies.questionId, questionId))
  if (replyId !== null) {
    await db
      .update(replies)
      .set({ isSolution: true })
      .where(eq(replies.id, replyId))
  }
}

// ── Reactions ──────────────────────────────────────────────────────────────

// Returns true if a new reaction was added, false if it was removed (toggle)
export async function toggleQuestionReaction(forumId: number, userId: number): Promise<boolean> {
  const existing = await db
    .select()
    .from(questionReactions)
    .where(and(eq(questionReactions.forumId, forumId), eq(questionReactions.userId, userId)))

  if (existing.length) {
    await db
      .delete(questionReactions)
      .where(and(eq(questionReactions.forumId, forumId), eq(questionReactions.userId, userId)))
    return false  // unliked
  } else {
    await db.insert(questionReactions).values({ forumId, userId })
    return true   // liked
  }
}

export async function toggleReplyReaction(replyId: number, userId: number): Promise<boolean> {
  const existing = await db
    .select()
    .from(replyReactions)
    .where(and(eq(replyReactions.replyId, replyId), eq(replyReactions.userId, userId)))

  if (existing.length) {
    await db
      .delete(replyReactions)
      .where(and(eq(replyReactions.replyId, replyId), eq(replyReactions.userId, userId)))
    return false
  } else {
    await db.insert(replyReactions).values({ replyId, userId })
    return true
  }
}

// Check if a user has liked specific items — used to show filled/empty heart
export async function getUserReactionsForQuestion(questionId: number, userId: number) {
  const questionLike = await db
    .select()
    .from(questionReactions)
    .where(and(eq(questionReactions.forumId, questionId), eq(questionReactions.userId, userId)))

  const replyLikes = await db
    .select({ replyId: replyReactions.replyId })
    .from(replyReactions)
    .leftJoin(replies, eq(replyReactions.replyId, replies.id))
    .where(and(eq(replies.questionId, questionId), eq(replyReactions.userId, userId)))

  return {
    likedQuestion: questionLike.length > 0,
    likedReplyIds: replyLikes.map(r => r.replyId),
  }
}

// ── Follows ────────────────────────────────────────────────────────────────

export async function toggleQuestionFollow(questionId: number, userId: number): Promise<boolean> {
  const existing = await db
    .select()
    .from(questionFollows)
    .where(and(eq(questionFollows.questionId, questionId), eq(questionFollows.userId, userId)))

  if (existing.length) {
    await db
      .delete(questionFollows)
      .where(and(eq(questionFollows.questionId, questionId), eq(questionFollows.userId, userId)))
    return false
  } else {
    await db.insert(questionFollows).values({ questionId, userId })
    return true
  }
}

export async function getQuestionFollowers(questionId: number): Promise<number[]> {
  const rows = await db
    .select({ userId: questionFollows.userId })
    .from(questionFollows)
    .where(eq(questionFollows.questionId, questionId))
  return rows.map(r => r.userId)
}

export async function isFollowingQuestion(questionId: number, userId: number): Promise<boolean> {
  const rows = await db
    .select()
    .from(questionFollows)
    .where(and(eq(questionFollows.questionId, questionId), eq(questionFollows.userId, userId)))
  return rows.length > 0
}

// ── Tags ───────────────────────────────────────────────────────────────────

export async function getAllTags() {
  return db.select().from(questionTags)
}

export async function createTag(data: { name: string; short?: string; color?: string }) {
  const [t] = await db.insert(questionTags).values(data).returning()
  return t
}