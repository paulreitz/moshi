import { getDatabase, schema } from '../database';
import { eq, desc, and } from 'drizzle-orm';
import { generateMessage, evaluateResponse, EvaluationResult } from './llm';
import { sendMessage, setMessageHandler } from './telegram';
import {
  emitConversationStarted,
  emitConversationCompleted,
  emitConversationAbandoned,
  emitMessageSent,
  emitMessageReceived,
  emitReviewCreated
} from './events';

interface TelegramMessageType {
  message_id: number;
  chat: { id: number };
  text?: string;
  date: number;
}

async function getSettings() {
  const db = getDatabase();
  const result = await db.select().from(schema.settings).limit(1);
  return result[0] ?? null;
}

async function getRandomActivePersona() {
  const db = getDatabase();
  const personas = await db
    .select()
    .from(schema.personas)
    .where(eq(schema.personas.isActive, true));

  if (personas.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * personas.length);
  return personas[randomIndex];
}

async function getRecentPersonaMessages(personaId: number, limit: number = 5): Promise<string[]> {
  const db = getDatabase();

  // Get recent agent messages from conversations with this persona
  const messages = await db
    .select({ contentJa: schema.messages.contentJa })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.messages.conversationId, schema.conversations.id)
    )
    .where(
      and(
        eq(schema.conversations.personaId, personaId),
        eq(schema.messages.role, 'agent')
      )
    )
    .orderBy(desc(schema.messages.sentAt))
    .limit(limit);

  return messages.map((m) => m.contentJa);
}

export async function createConversation(personaId: number): Promise<number> {
  const db = getDatabase();
  const [conversation] = await db
    .insert(schema.conversations)
    .values({ personaId })
    .returning();

  return conversation.id;
}

export async function addMessage(
  conversationId: number,
  role: 'agent' | 'user',
  contentJa: string,
  contentEn: string | null = null,
  telegramMessageId: string | null = null
): Promise<number> {
  const db = getDatabase();
  const [message] = await db
    .insert(schema.messages)
    .values({
      conversationId,
      role,
      contentJa,
      contentEn,
      telegramMessageId
    })
    .returning();

  return message.id;
}

export async function addReview(
  messageId: number,
  evaluation: EvaluationResult
): Promise<number> {
  const db = getDatabase();
  const [review] = await db
    .insert(schema.reviews)
    .values({
      messageId,
      grade: evaluation.grade,
      feedback: evaluation.feedback,
      grammarNotes: evaluation.grammarNotes,
      vocabularyNotes: evaluation.vocabularyNotes
    })
    .returning();

  return review.id;
}

export async function completeConversation(conversationId: number): Promise<void> {
  const db = getDatabase();
  await db
    .update(schema.conversations)
    .set({
      status: 'completed',
      endedAt: new Date()
    })
    .where(eq(schema.conversations.id, conversationId));
}

export async function getConversationMessages(conversationId: number) {
  const db = getDatabase();
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.sentAt);
}

export async function getActiveConversation() {
  const db = getDatabase();
  const conversations = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.status, 'active'))
    .orderBy(desc(schema.conversations.startedAt))
    .limit(1);

  return conversations[0] ?? null;
}

// Current active conversation state
let currentConversationId: number | null = null;
let lastAgentMessageJa: string | null = null;
let waitingForReply = false;
let replyTimeout: NodeJS.Timeout | null = null;

const REPLY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes to reply

export async function startNewConversation(): Promise<{
  conversationId: number;
  japanese: string;
  english: string;
} | null> {
  const settings = await getSettings();
  if (!settings) {
    console.error('Settings not found');
    return null;
  }

  const persona = await getRandomActivePersona();
  if (!persona) {
    console.error('No active personas found');
    return null;
  }

  try {
    // Get recent messages from this persona to avoid repetition
    const recentMessages = await getRecentPersonaMessages(persona.id, 5);

    // Generate opening message
    const { japanese, english } = await generateMessage(
      persona.name,
      persona.description,
      settings.jlptLevel,
      settings.useKanji,
      recentMessages
    );

    // Create conversation in database
    const conversationId = await createConversation(persona.id);

    // Send via Telegram with persona name prefix
    const telegramMsg = await sendMessage(`${persona.name}: ${japanese}`);

    // Store agent message
    const agentMessageId = await addMessage(
      conversationId,
      'agent',
      japanese,
      english,
      telegramMsg.message_id.toString()
    );

    // Emit events
    emitConversationStarted(conversationId);
    emitMessageSent(conversationId, agentMessageId);

    // Set up state for waiting for reply
    currentConversationId = conversationId;
    lastAgentMessageJa = japanese;
    waitingForReply = true;

    // Set timeout for reply
    if (replyTimeout) {
      clearTimeout(replyTimeout);
    }
    replyTimeout = setTimeout(() => {
      handleReplyTimeout();
    }, REPLY_TIMEOUT_MS);

    console.log(`Started conversation ${conversationId} with ${persona.name}`);

    return { conversationId, japanese, english };
  } catch (error) {
    console.error('Failed to start conversation:', error);
    return null;
  }
}

async function handleReplyTimeout(): Promise<void> {
  if (currentConversationId && waitingForReply) {
    console.log(`Conversation ${currentConversationId} timed out waiting for reply`);

    const abandonedId = currentConversationId;

    const db = getDatabase();
    await db
      .update(schema.conversations)
      .set({
        status: 'abandoned',
        endedAt: new Date()
      })
      .where(eq(schema.conversations.id, currentConversationId));

    emitConversationAbandoned(abandonedId);

    currentConversationId = null;
    lastAgentMessageJa = null;
    waitingForReply = false;
  }
}

export async function handleUserReply(message: TelegramMessageType): Promise<void> {
  if (!waitingForReply || !currentConversationId || !lastAgentMessageJa) {
    console.log('Received message but not waiting for reply');
    return;
  }

  const userText = message.text;
  if (!userText) {
    return;
  }

  // Clear reply timeout
  if (replyTimeout) {
    clearTimeout(replyTimeout);
    replyTimeout = null;
  }

  waitingForReply = false;

  const settings = await getSettings();
  if (!settings) {
    return;
  }

  try {
    // Store user message
    const messageId = await addMessage(
      currentConversationId,
      'user',
      userText,
      null,
      message.message_id.toString()
    );

    emitMessageReceived(currentConversationId, messageId);

    // Evaluate the response
    const evaluation = await evaluateResponse(
      lastAgentMessageJa,
      userText,
      settings.jlptLevel
    );

    // Store the review
    const reviewId = await addReview(messageId, evaluation);
    emitReviewCreated(reviewId, currentConversationId);

    // Update the user message with English translation
    const db = getDatabase();
    await db
      .update(schema.messages)
      .set({ contentEn: evaluation.replyEnglish })
      .where(eq(schema.messages.id, messageId));

    // Complete the conversation
    await completeConversation(currentConversationId);
    emitConversationCompleted(currentConversationId);

    console.log(`Completed conversation ${currentConversationId} with grade: ${evaluation.grade}`);

    // Reset state
    currentConversationId = null;
    lastAgentMessageJa = null;
  } catch (error) {
    console.error('Failed to handle user reply:', error);
  }
}

export function setupMessageHandler(): void {
  setMessageHandler((message) => {
    handleUserReply(message as TelegramMessageType);
  });
}

export function isWaitingForReply(): boolean {
  return waitingForReply;
}

export function getCurrentConversationId(): number | null {
  return currentConversationId;
}
