import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware.js'
import { getSession } from '../auth/session.js'
import { ForbiddenError, AppError } from '../auth/errors.js'
import {
  getRecentQuestions,
  getMostViewedQuestions,
  getQuestionById,
  createQuestion,
  deleteQuestion,
  getRepliesForQuestion,
  createReply,
  deleteReply,
  getAllTags,
  setSolutionReply
} from '../db/controllers/questions.js'

const forums = new Hono()

forums.get('/recent', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const questions = await getRecentQuestions(limit)
  return c.json(questions)
})

forums.get('/top', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 10), 100)
  const questions = await getMostViewedQuestions(limit)
  return c.json(questions)
})

forums.get('/tags', async (c) => {
  return c.json(await getAllTags())
})

forums.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
  const question = await getQuestionById(id)
  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')
  return c.json(question)
})

forums.get('/:id/replies', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
  return c.json(await getRepliesForQuestion(id))
})

forums.post('/', requireAuth, zValidator('json', z.object({
  title:   z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().max(10000).optional(),
  tagId:   z.number().int().optional(),
})), async (c) => {
  const session = await getSession(c)
  const body    = c.req.valid('json')
  const q = await createQuestion({ userId: session!.userId, ...body })
  return c.json(q, 201)
})

forums.post('/:id/replies', requireAuth, zValidator('json', z.object({
  content: z.string().min(1, 'Reply cannot be empty').max(10000),
})), async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  if (isNaN(questionId)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

  const question = await getQuestionById(questionId)
  if (!question) throw new AppError('Question not found', 404, 'NOT_FOUND')

  const { content } = c.req.valid('json')
  const r = await createReply({ questionId, userId: session!.userId, content })
  return c.json(r, 201)
})

forums.patch('/:id/solution', requireAuth, zValidator('json', z.object({
  replyId: z.number().int().nullable(),
})), async (c) => {
  const session    = await getSession(c)
  const questionId = Number(c.req.param('id'))
  const question   = await getQuestionById(questionId)

  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')
  if (question.authorId !== session!.userId)
    throw new ForbiddenError('Only the question author can mark a solution')

  await setSolutionReply(questionId, c.req.valid('json').replyId)
  return c.json({ ok: true })
})

forums.delete('/:id', requireAuth, async (c) => {
  const session  = await getSession(c)
  const id       = Number(c.req.param('id'))
  const question = await getQuestionById(id)
  if (!question) throw new AppError('Not found', 404, 'NOT_FOUND')

  const isOwner  = question.authorId === session!.userId
  const canDelete = session!.canDeleteReply

  if (!isOwner && !canDelete) throw new ForbiddenError('Cannot delete this question')
  await deleteQuestion(id)
  return c.json({ ok: true })
})

forums.delete('/replies/:replyId', requireAuth, async (c) => {
  const session = await getSession(c)
  if (!session!.canDeleteReply) throw new ForbiddenError('Cannot delete replies')
  await deleteReply(Number(c.req.param('replyId')))
  return c.json({ ok: true })
})

export { forums }