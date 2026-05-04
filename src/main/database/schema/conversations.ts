import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { personas } from './personas';

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  personaId: integer('persona_id')
    .notNull()
    .references(() => personas.id),
  startedAt: integer('started_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('active') // 'active', 'completed', 'abandoned'
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
