import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type {
  Settings,
  UpdateSettings,
  Persona,
  CreatePersona,
  UpdatePersona,
  Conversation,
  ConversationWithMessages,
  Review,
  SchedulerStatus,
  AppEvent
} from '../shared/types';

// Custom APIs for renderer
const api = {
  // Settings
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    update: (data: UpdateSettings): Promise<Settings> =>
      ipcRenderer.invoke('settings:update', data)
  },

  // Personas
  personas: {
    list: (): Promise<Persona[]> => ipcRenderer.invoke('personas:list'),
    get: (id: number): Promise<Persona | null> =>
      ipcRenderer.invoke('personas:get', id),
    create: (data: CreatePersona): Promise<Persona> =>
      ipcRenderer.invoke('personas:create', data),
    update: (id: number, data: UpdatePersona): Promise<Persona> =>
      ipcRenderer.invoke('personas:update', id, data),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke('personas:delete', id)
  },

  // Conversations
  conversations: {
    list: (): Promise<Conversation[]> => ipcRenderer.invoke('conversations:list'),
    get: (id: number): Promise<ConversationWithMessages | null> =>
      ipcRenderer.invoke('conversations:get', id)
  },

  // Reviews
  reviews: {
    list: (): Promise<Review[]> => ipcRenderer.invoke('reviews:list'),
    unread: (): Promise<Review[]> => ipcRenderer.invoke('reviews:unread'),
    unreadCount: (): Promise<number> => ipcRenderer.invoke('reviews:unread-count'),
    markSeen: (id: number): Promise<void> =>
      ipcRenderer.invoke('reviews:mark-seen', id)
  },

  // LLM
  llm: {
    fetchModels: (endpoint: string, apiKey?: string): Promise<string[]> =>
      ipcRenderer.invoke('llm:fetch-models', endpoint, apiKey)
  },

  // Scheduler
  scheduler: {
    start: (): Promise<void> => ipcRenderer.invoke('scheduler:start'),
    stop: (): Promise<void> => ipcRenderer.invoke('scheduler:stop'),
    status: (): Promise<SchedulerStatus> => ipcRenderer.invoke('scheduler:status')
  },

  // Events
  events: {
    onAppEvent: (callback: (event: AppEvent) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: AppEvent): void => {
        callback(data);
      };
      ipcRenderer.on('app-event', handler);
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener('app-event', handler);
      };
    }
  }
};

// Type for the exposed API
export type Api = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
