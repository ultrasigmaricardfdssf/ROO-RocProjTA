import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users.js'

export const questions = sqliteTable('forumQuestion', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content'),
  tagId: integer('tag_id').notNull().references(() => questionTags.id).default(0),
  solutionId: integer('solution_id').references(() => replies.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  editedAt: integer('edited_at', { mode: 'timestamp' })
})

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert

export const questionTags = sqliteTable('forumTag', {
  id : integer('id').primaryKey({ autoIncrement: true }),
  color : text('color').default('#AAAAAA'),
  name: text('name').notNull(),
  short: text('short')
})

export type QuestionTag = typeof questionTags.$inferSelect
export type NewQuestionTag= typeof questionTags.$inferInsert

export const questionReactions = sqliteTable('forumReaction', {
  id : integer('id').primaryKey({ autoIncrement: true }),
  forumId : integer('forum_id').notNull().references(() => questions.id),
  userId : integer('user_id').notNull().references(() => users.id),
})

export type QuestionReaction = typeof questionReactions.$inferSelect
export type NewQuestionReaction = typeof questionReactions.$inferInsert

export const replies = sqliteTable('forumReply', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id').notNull().references(() => questions.id),
  userId: integer('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type QeustionReply = typeof replies.$inferSelect
export type NewQuestionReply = typeof replies.$inferInsert

export const replyReactions = sqliteTable('forumReplyReaction', {
  id : integer('id').primaryKey({ autoIncrement: true }),
  replyId : integer('reply_id').notNull().references(() => replies.id),
  userId : integer('user_id').notNull().references(() => users.id),
})

export type QuestionReactionReply = typeof replyReactions.$inferSelect
export type NewQuestionReactionReply = typeof replyReactions.$inferInsert