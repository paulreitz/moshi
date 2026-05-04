// Database entity types (matching Drizzle schema)
export interface Settings {
  id: number;
  llmEndpoint: string;
  llmApiKey: string | null;
  llmModel: string;
  telegramBotToken: string;
  telegramChatId: string;
  jlptLevel: string;
  useKanji: boolean;
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  activeStartTime: string;
  activeEndTime: string;
  isActive: boolean;
}

export interface Persona {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  personaId: number;
  startedAt: Date;
  endedAt: Date | null;
  status: string;
}

export interface Message {
  id: number;
  conversationId: number;
  replyToId: number | null;
  role: 'agent' | 'user';
  contentJa: string;
  contentEn: string | null;
  telegramMessageId: string | null;
  sentAt: Date;
}

export interface Review {
  id: number;
  messageId: number;
  grade: 'excellent' | 'good' | 'fair' | 'needs_work';
  feedback: string;
  grammarNotes: string | null;
  vocabularyNotes: string | null;
  isSeen: boolean;
  createdAt: Date;
}

// Conversation with related data
export interface ConversationWithMessages extends Conversation {
  persona: Persona;
  messages: Message[];
  review: Review | null;
}

// Review with context (message and conversation info)
export interface ReviewWithContext extends Review {
  message: Message;
  agentMessage: Message | null;
  conversationId: number;
  personaName: string;
}

// Input types for creating/updating entities
export interface CreatePersona {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface UpdatePersona {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSettings {
  llmEndpoint?: string;
  llmApiKey?: string | null;
  llmModel?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  jlptLevel?: string;
  useKanji?: boolean;
  minIntervalMinutes?: number;
  maxIntervalMinutes?: number;
  activeStartTime?: string;
  activeEndTime?: string;
  isActive?: boolean;
}

// Scheduler status
export interface SchedulerStatus {
  isRunning: boolean;
  nextMessageAt: Date | null;
}

// IPC Channel definitions
export interface IpcChannels {
  // Settings
  'settings:get': { args: []; return: Settings };
  'settings:update': { args: [UpdateSettings]; return: Settings };

  // Personas
  'personas:list': { args: []; return: Persona[] };
  'personas:get': { args: [number]; return: Persona | null };
  'personas:create': { args: [CreatePersona]; return: Persona };
  'personas:update': { args: [number, UpdatePersona]; return: Persona };
  'personas:delete': { args: [number]; return: void };

  // Conversations
  'conversations:list': { args: []; return: Conversation[] };
  'conversations:get': { args: [number]; return: ConversationWithMessages | null };

  // Reviews
  'reviews:list': { args: []; return: ReviewWithContext[] };
  'reviews:unread': { args: []; return: ReviewWithContext[] };
  'reviews:unread-count': { args: []; return: number };
  'reviews:mark-seen': { args: [number]; return: void };

  // LLM
  'llm:fetch-models': { args: [string, string?]; return: string[] };

  // Scheduler
  'scheduler:start': { args: []; return: void };
  'scheduler:stop': { args: []; return: void };
  'scheduler:status': { args: []; return: SchedulerStatus };
}

// Helper type to extract channel names
export type IpcChannel = keyof IpcChannels;

// Helper type to extract args for a channel
export type IpcArgs<T extends IpcChannel> = IpcChannels[T]['args'];

// Helper type to extract return type for a channel
export type IpcReturn<T extends IpcChannel> = IpcChannels[T]['return'];

// App events for real-time UI updates
export type AppEvent =
  | { type: 'conversation:started'; conversationId: number }
  | { type: 'conversation:completed'; conversationId: number }
  | { type: 'conversation:abandoned'; conversationId: number }
  | { type: 'message:sent'; conversationId: number; messageId: number }
  | { type: 'message:received'; conversationId: number; messageId: number }
  | { type: 'review:created'; reviewId: number; conversationId: number }
  | { type: 'scheduler:started' }
  | { type: 'scheduler:stopped' }
  | { type: 'scheduler:next-message'; nextMessageAt: Date }
  | { type: 'navigate'; path: string };

export type AppEventType = AppEvent['type'];
