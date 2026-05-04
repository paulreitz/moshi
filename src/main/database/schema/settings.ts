import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  llmEndpoint: text('llm_endpoint').notNull().default(''),
  llmApiKey: text('llm_api_key'),
  llmModel: text('llm_model').notNull().default(''),
  telegramBotToken: text('telegram_bot_token').notNull().default(''),
  telegramChatId: text('telegram_chat_id').notNull().default(''),
  jlptLevel: text('jlpt_level').notNull().default('N5'),
  useKanji: integer('use_kanji', { mode: 'boolean' }).notNull().default(false),
  minIntervalMinutes: integer('min_interval_minutes').notNull().default(30),
  maxIntervalMinutes: integer('max_interval_minutes').notNull().default(120),
  activeStartTime: text('active_start_time').notNull().default('09:00'),
  activeEndTime: text('active_end_time').notNull().default('21:00'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false)
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
