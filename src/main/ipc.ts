import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { getDatabase, schema } from './database';
import { fetchModels } from './services/llm';
import * as scheduler from './services/scheduler';
import type {
  UpdateSettings,
  CreatePersona,
  UpdatePersona
} from '../shared/types';

export function registerIpcHandlers(): void {
  const db = getDatabase();

  // ============ Settings ============
  ipcMain.handle('settings:get', async () => {
    const result = await db.select().from(schema.settings).limit(1);
    if (result.length === 0) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(schema.settings).values({}).returning();
      return newSettings;
    }
    return result[0];
  });

  ipcMain.handle('settings:update', async (_event, data: UpdateSettings) => {
    // Get current settings or create if not exists
    let current = await db.select().from(schema.settings).limit(1);
    if (current.length === 0) {
      const [newSettings] = await db.insert(schema.settings).values(data).returning();
      return newSettings;
    }

    const [updated] = await db
      .update(schema.settings)
      .set(data)
      .where(eq(schema.settings.id, current[0].id))
      .returning();
    return updated;
  });

  // ============ Personas ============
  ipcMain.handle('personas:list', async () => {
    return db.select().from(schema.personas).orderBy(schema.personas.createdAt);
  });

  ipcMain.handle('personas:get', async (_event, id: number) => {
    const result = await db
      .select()
      .from(schema.personas)
      .where(eq(schema.personas.id, id))
      .limit(1);
    return result[0] ?? null;
  });

  ipcMain.handle('personas:create', async (_event, data: CreatePersona) => {
    const [persona] = await db.insert(schema.personas).values(data).returning();
    return persona;
  });

  ipcMain.handle('personas:update', async (_event, id: number, data: UpdatePersona) => {
    const [updated] = await db
      .update(schema.personas)
      .set(data)
      .where(eq(schema.personas.id, id))
      .returning();
    return updated;
  });

  ipcMain.handle('personas:delete', async (_event, id: number) => {
    await db.delete(schema.personas).where(eq(schema.personas.id, id));
  });

  // ============ Conversations ============
  ipcMain.handle('conversations:list', async () => {
    return db
      .select()
      .from(schema.conversations)
      .orderBy(schema.conversations.startedAt);
  });

  ipcMain.handle('conversations:get', async (_event, id: number) => {
    const conversation = await db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, id))
      .limit(1);

    if (conversation.length === 0) return null;

    const persona = await db
      .select()
      .from(schema.personas)
      .where(eq(schema.personas.id, conversation[0].personaId))
      .limit(1);

    const messages = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, id))
      .orderBy(schema.messages.sentAt);

    // Get review for the last user message if exists
    const userMessages = messages.filter((m) => m.role === 'user');
    let review: typeof schema.reviews.$inferSelect | null = null;
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      const reviewResult = await db
        .select()
        .from(schema.reviews)
        .where(eq(schema.reviews.messageId, lastUserMessage.id))
        .limit(1);
      review = reviewResult[0] ?? null;
    }

    return {
      ...conversation[0],
      persona: persona[0],
      messages,
      review
    };
  });

  // ============ Reviews ============
  async function getReviewsWithContext(unreadOnly: boolean) {
    const whereClause = unreadOnly ? eq(schema.reviews.isSeen, false) : undefined;
    const reviews = whereClause
      ? await db.select().from(schema.reviews).where(whereClause).orderBy(schema.reviews.createdAt)
      : await db.select().from(schema.reviews).orderBy(schema.reviews.createdAt);

    const reviewsWithContext = await Promise.all(
      reviews.map(async (review) => {
        // Get the user message this review is for
        const messages = await db
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.id, review.messageId))
          .limit(1);
        const message = messages[0];

        if (!message) {
          return null;
        }

        // Get the conversation
        const conversations = await db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.id, message.conversationId))
          .limit(1);
        const conversation = conversations[0];

        // Get the agent message (the one before the user's reply)
        const allMessages = await db
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.conversationId, message.conversationId))
          .orderBy(schema.messages.sentAt);
        const agentMessage = allMessages.find((m) => m.role === 'agent') ?? null;

        // Get persona name
        const personas = await db
          .select()
          .from(schema.personas)
          .where(eq(schema.personas.id, conversation.personaId))
          .limit(1);
        const personaName = personas[0]?.name ?? 'Unknown';

        return {
          ...review,
          message,
          agentMessage,
          conversationId: message.conversationId,
          personaName
        };
      })
    );

    return reviewsWithContext.filter((r) => r !== null);
  }

  ipcMain.handle('reviews:list', async () => {
    return getReviewsWithContext(false);
  });

  ipcMain.handle('reviews:unread', async () => {
    return getReviewsWithContext(true);
  });

  ipcMain.handle('reviews:unread-count', async () => {
    const result = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.isSeen, false));
    return result.length;
  });

  ipcMain.handle('reviews:mark-seen', async (_event, id: number) => {
    await db
      .update(schema.reviews)
      .set({ isSeen: true })
      .where(eq(schema.reviews.id, id));
  });

  // ============ LLM ============
  ipcMain.handle('llm:fetch-models', async (_event, endpoint: string, apiKey?: string) => {
    return fetchModels(endpoint, apiKey);
  });

  // ============ Scheduler ============
  ipcMain.handle('scheduler:start', async () => {
    await scheduler.start();
  });

  ipcMain.handle('scheduler:stop', async () => {
    scheduler.stop();
  });

  ipcMain.handle('scheduler:status', async () => {
    return scheduler.getStatus();
  });
}
