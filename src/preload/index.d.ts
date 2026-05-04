import { ElectronAPI } from '@electron-toolkit/preload';
import type {
  Settings,
  UpdateSettings,
  Persona,
  CreatePersona,
  UpdatePersona,
  Conversation,
  ConversationWithMessages,
  Review,
  ReviewWithContext,
  SchedulerStatus,
  AppEvent
} from '../shared/types';

export interface Api {
  settings: {
    get: () => Promise<Settings>;
    update: (data: UpdateSettings) => Promise<Settings>;
  };
  personas: {
    list: () => Promise<Persona[]>;
    get: (id: number) => Promise<Persona | null>;
    create: (data: CreatePersona) => Promise<Persona>;
    update: (id: number, data: UpdatePersona) => Promise<Persona>;
    delete: (id: number) => Promise<void>;
  };
  conversations: {
    list: () => Promise<Conversation[]>;
    get: (id: number) => Promise<ConversationWithMessages | null>;
  };
  reviews: {
    list: () => Promise<ReviewWithContext[]>;
    unread: () => Promise<ReviewWithContext[]>;
    unreadCount: () => Promise<number>;
    markSeen: (id: number) => Promise<void>;
  };
  llm: {
    fetchModels: (endpoint: string, apiKey?: string) => Promise<string[]>;
  };
  scheduler: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    status: () => Promise<SchedulerStatus>;
  };
  events: {
    onAppEvent: (callback: (event: AppEvent) => void) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
