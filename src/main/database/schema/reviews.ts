import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { messages } from './messages';

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  messageId: integer('message_id')
    .notNull()
    .references(() => messages.id),
  grade: text('grade').notNull(), // 'excellent', 'good', 'fair', 'needs_work'
  feedback: text('feedback').notNull(),
  grammarNotes: text('grammar_notes'),
  vocabularyNotes: text('vocabulary_notes'),
  isSeen: integer('is_seen', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
