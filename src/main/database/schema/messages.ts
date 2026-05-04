import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { conversations } from './conversations';

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id),
  role: text('role').notNull(), // 'agent' or 'user'
  contentJa: text('content_ja').notNull(),
  contentEn: text('content_en'),
  telegramMessageId: text('telegram_message_id'),
  sentAt: integer('sent_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
