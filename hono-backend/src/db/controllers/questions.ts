import { eq, desc, sql } from 'drizzle-orm'
import { db, questions, replies, questionTags, questionReactions, replyReactions, users } from '../index.js'

export async function getRecentQuestions(limit = 20) {
  return db
    .select({
      id:           questions.id,
      title:        questions.title,
      content:      questions.content,
      createdAt:    questions.createdAt,
      authorId:     users.id,
      authorName:   users.username,
      tagId:        questionTags.id,
      tagName:      questionTags.name,
      tagShort:     questionTags.short,
      tagColor:     questionTags.color,
      replyCount:   sql<number>`(SELECT COUNT(*) FROM forumReply WHERE question_id = ${questions.id})`,
      reactionCount:sql<number>`(SELECT COUNT(*) FROM forumReaction WHERE forum_id = ${questions.id})`,
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
      id:           questions.id,
      title:        questions.title,
      content:      questions.content,
      createdAt:    questions.createdAt,
      authorId:     users.id,
      authorName:   users.username,
      tagId:        questionTags.id,
      tagName:      questionTags.name,
      tagShort:     questionTags.short,
      tagColor:     questionTags.color,
      replyCount:   sql<number>`(SELECT COUNT(*) FROM forumReply WHERE question_id = ${questions.id})`,
    })
    .from(questions)
    .leftJoin(users,        eq(questions.userId, users.id))
    .leftJoin(questionTags, eq(questions.tagId,  questionTags.id))
    .orderBy(sql`replyCount DESC`)
    .limit(limit)
}

export async function getQuestionById(id: number) {
  const [question] = await db
    .select({
      id:          questions.id,
      title:       questions.title,
      content:     questions.content,
      createdAt:   questions.createdAt,
      editedAt:    questions.editedAt,
      authorId:    users.id,
      authorName:  users.username,
      tagId:       questionTags.id,
      tagName:     questionTags.name,
      tagColor:    questionTags.color,
      tagShort:    questionTags.short,
    })
    .from(questions)
    .leftJoin(users,        eq(questions.userId, users.id))
    .leftJoin(questionTags, eq(questions.tagId,  questionTags.id))
    .where(eq(questions.id, id))
  return question ?? null
}

export async function createQuestion(data: { userId: number; title: string; content?: string; tagId?: number }) {
  const [q] = await db.insert(questions).values(data).returning()
  return q
}

export async function deleteQuestion(id: number) {
  await db.delete(questions).where(eq(questions.id, id))
}

export async function getRepliesForQuestion(questionId: number) {
  return db
    .select({
      id:         replies.id,
      content:    replies.content,
      createdAt:  replies.createdAt,
      isSolution: replies.isSolution,
      authorId:   users.id,
      authorName: users.username,
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

export async function getAllTags() {
  return db.select().from(questionTags)
}

export async function createTag(data: { name: string; short?: string; color?: string }) {
  const [t] = await db.insert(questionTags).values(data).returning()
  return t
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