import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { AppError, ForbiddenError } from '../auth/errors.js'
import {
  getRecentQuestions, getMostViewedQuestions,
  getQuestionById, createQuestion, deleteQuestion, incrementViewCount,
  getRepliesForQuestion, createReply, deleteReply, setSolutionReply,
  toggleQuestionReaction, toggleReplyReaction, getUserReactionsForQuestion,
  toggleQuestionFollow, isFollowingQuestion, getQuestionFollowers,
  getAllTags, createTag,
  getReplyReactionCount,
} from '../db/controllers/questions.js'
import {
  notifyForumReply, notifyFollowers, notifyReplyReaction,
  notifyQuestionReaction, notifyReplyMarkedSolution,
} from '../db/controllers/notifications.js'
import { getUserById } from '../db/controllers/users.js'
import { eq, desc, sql } from 'drizzle-orm'
import { db, questions, replies, questionTags, users } from '../db/index.js'

const forums = new Hono()

// ── Questions ──────────────────────────────────────────────────────────────

forums.get('/recent', async (c) => {
  return c.json(await getRecentQuestions(Math.min(Number(c.req.query('limit') ?? 20), 100)))
})

forums.get('/top', async (c) => {
  return c.json(await getMostViewedQuestions(Math.min(Number(c.req.query('limit') ?? 10), 100)))
})

forums.get('/tags', async (c) => {
  return c.json(await getAllTags())
})

forums.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const question = await getQuestionById(id)
  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')

  // If logged in, also return whether user liked/follows this question
  const session = await getSession(c)
  let userReactions = { likedQuestion: false, likedReplyIds: [] as number[] }
  let isFollowing   = false

  if (session) {
    userReactions = await getUserReactionsForQuestion(id, session.userId)
    isFollowing   = await isFollowingQuestion(id, session.userId)
    incrementViewCount(id, session.userId)
  }

  return c.json({ ...question, ...userReactions, isFollowing })
})

forums.post('/', requireAuth, zValidator('json', z.object({
  title:   z.string().min(3).max(200),
  content: z.string().max(10000).optional(),
  tagId:   z.number().int().optional(),
})), async (c) => {
  const session = await getSession(c)
  const q = await createQuestion({ userId: session!.userId, ...c.req.valid('json') })
  // Auto-follow your own question
  await toggleQuestionFollow(q.id, session!.userId)
  return c.json(q, 201)
})

forums.delete('/:id', requireAuth, async (c) => {
  const session  = await getSession(c)
  const id       = Number(c.req.param('id'))
  const question = await getQuestionById(id)
  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')
  if (question.authorId !== session!.userId && !session!.canDeleteReply)
    throw new ForbiddenError('Cannot delete this question')
  await deleteQuestion(id)
  return c.json({ ok: true })
})

// ── Replies ────────────────────────────────────────────────────────────────

forums.get('/:id/replies', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
  return c.json(await getRepliesForQuestion(id))
})

forums.post('/:id/replies', requireAuth, zValidator('json', z.object({
  content: z.string().min(1).max(10000),
})), async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  const question   = await getQuestionById(questionId)
  if (!question) throw new AppError('Question not found', 404, 'NOT_FOUND')

  const r    = await createReply({ questionId, userId: session!.userId, content: c.req.valid('json').content })
  const user = await getUserById(session!.userId)

  // Notify question author
  await notifyForumReply(question.authorId!, session!.userId, questionId, user!.username, question.title)

  // Notify all followers
  const followers = await getQuestionFollowers(questionId)
  await notifyFollowers(followers, session!.userId, questionId, user!.username, question.title)

  return c.json(r, 201)
})

forums.delete('/replies/:replyId', requireAuth, async (c) => {
  const session = await getSession(c)
  if (!session!.canDeleteReply) throw new ForbiddenError('Cannot delete replies')
  await deleteReply(Number(c.req.param('replyId')))
  return c.json({ ok: true })
})

// ── Solution ───────────────────────────────────────────────────────────────

forums.patch('/:id/solution', requireAuth, zValidator('json', z.object({
  replyId: z.number().int().nullable(),
})), async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  const question   = await getQuestionById(questionId)
  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')
  if (question.authorId !== session!.userId)
    throw new ForbiddenError('Only the question author can mark a solution')

  const { replyId } = c.req.valid('json')
  await setSolutionReply(questionId, replyId)

  // Notify reply author if marking (not unmarking)
  if (replyId !== null) {
    const [reply] = await db.select().from(replies).where(eq(replies.id, replyId))
    if (reply) {
      await notifyReplyMarkedSolution(reply.userId, session!.userId, questionId, question.title)
    }
  }

  return c.json({ ok: true, solutionId: replyId })
})

// ── Reactions ──────────────────────────────────────────────────────────────

// POST /forums/:id/react — like/unlike a question
forums.post('/:id/react', requireAuth, async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  const question   = await getQuestionById(questionId)
  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')

  const liked = await toggleQuestionReaction(questionId, session!.userId)
  const user  = await getUserById(session!.userId)

  if (liked) {
    await notifyQuestionReaction(question.authorId!, session!.userId, questionId, user!.username, question.title)
  }

  // Return new count
  const updated = await getQuestionById(questionId)
  return c.json({ liked, reactionCount: updated?.reactionCount ?? 0 })
})

// POST /forums/replies/:replyId/react — like/unlike a reply
forums.post('/replies/:replyId/react', requireAuth, async (c) => {
  const session = await getSession(c)
  const replyId = Number(c.req.param('replyId'))

  const [reply] = await db.select().from(replies).where(eq(replies.id, replyId))
  if (!reply) throw new AppError('Reply not found', 404, 'NOT_FOUND')

  const liked = await toggleReplyReaction(replyId, session!.userId)
  const user  = await getUserById(session!.userId)

  if (liked) {
    await notifyReplyReaction(reply.userId, session!.userId, reply.questionId, user!.username)
  }

  const reactionCount = await getReplyReactionCount(replyId)
  return c.json({ liked, reactionCount })
})

// ── Follows ────────────────────────────────────────────────────────────────

// POST /forums/:id/follow — follow/unfollow a question
forums.post('/:id/follow', requireAuth, async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  const following  = await toggleQuestionFollow(questionId, session!.userId)
  return c.json({ following })
})

// ── Tags (admin only) ──────────────────────────────────────────────────────

forums.post('/tags', requireAuth, zValidator('json', z.object({
  name:  z.string().min(1),
  short: z.string().max(10).optional(),
  color: z.string().optional(),
})), async (c) => {
  const session = await getSession(c)
  if (!session!.canDeleteReply) throw new ForbiddenError('Admins only')
  return c.json(await createTag(c.req.valid('json')), 201)
})

// GET /forums/by-user/:userId — all questions by a user
forums.get('/by-user/:userId', requireAuth, async (c) => {
  const userId = Number(c.req.param('userId'))
  if (isNaN(userId)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const rows = await db
    .select({
      id:            questions.id,
      title:         questions.title,
      content:       questions.content,
      createdAt:     questions.createdAt,
      viewCount:     sql<number>`(SELECT COUNT(*) FROM forumView WHERE question_id = ${questions.id})`,
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
    .where(eq(questions.userId, userId))
    .orderBy(desc(questions.createdAt))

  return c.json(rows)
})

// GET /forums/replies-by-user/:userId — all replies by a user
forums.get('/replies-by-user/:userId', requireAuth, async (c) => {
  const userId = Number(c.req.param('userId'))
  if (isNaN(userId)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const rows = await db
    .select({
      id:            replies.id,
      content:       replies.content,
      createdAt:     replies.createdAt,
      isSolution:    replies.isSolution,
      questionId:    questions.id,
      questionTitle: questions.title,
    })
    .from(replies)
    .leftJoin(questions, eq(replies.questionId, questions.id))
    .where(eq(replies.userId, userId))
    .orderBy(desc(replies.createdAt))

  return c.json(rows)
})

export { forums }