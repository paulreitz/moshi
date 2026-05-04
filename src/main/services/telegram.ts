import { getDatabase, schema } from '../database';

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
  };
  text?: string;
  date: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

async function getSettings() {
  const db = getDatabase();
  const result = await db.select().from(schema.settings).limit(1);
  return result[0] ?? null;
}

async function telegramApi<T>(
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const settings = await getSettings();
  if (!settings?.telegramBotToken) {
    throw new Error('Telegram bot token not configured');
  }

  const url = `https://api.telegram.org/bot${settings.telegramBotToken}/${method}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data: TelegramResponse<T> = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description ?? 'Unknown error'}`);
  }

  return data.result;
}

export async function sendMessage(text: string): Promise<TelegramMessage> {
  const settings = await getSettings();
  if (!settings?.telegramChatId) {
    throw new Error('Telegram chat ID not configured');
  }

  return telegramApi<TelegramMessage>('sendMessage', {
    chat_id: settings.telegramChatId,
    text,
    parse_mode: 'HTML'
  });
}

export async function sendMessageWithTranslation(
  japanese: string,
  _english: string
): Promise<TelegramMessage> {
  // Send just the Japanese text - translation shown in app review
  return sendMessage(japanese);
}

let pollingOffset = 0;
let isPolling = false;
let pollingAbortController: AbortController | null = null;

export type MessageHandler = (message: TelegramMessage) => void;

let messageHandler: MessageHandler | null = null;

export function setMessageHandler(handler: MessageHandler | null): void {
  messageHandler = handler;
}

export async function startPolling(): Promise<void> {
  if (isPolling) return;

  isPolling = true;
  pollingAbortController = new AbortController();

  console.log('Starting Telegram polling...');

  while (isPolling) {
    try {
      const settings = await getSettings();
      if (!settings?.telegramBotToken || !settings?.telegramChatId) {
        console.log('Telegram not configured, stopping polling');
        break;
      }

      const updates = await getUpdates(pollingOffset, pollingAbortController.signal);

      for (const update of updates) {
        pollingOffset = update.update_id + 1;

        if (update.message?.text) {
          // Only process messages from the configured chat
          if (update.message.chat.id.toString() === settings.telegramChatId) {
            console.log('Received message:', update.message.text);
            if (messageHandler) {
              messageHandler(update.message);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Polling aborted');
        break;
      }
      console.error('Polling error:', error);
      // Wait before retrying on error
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log('Telegram polling stopped');
}

export function stopPolling(): void {
  isPolling = false;
  if (pollingAbortController) {
    pollingAbortController.abort();
    pollingAbortController = null;
  }
}

async function getUpdates(
  offset: number,
  signal?: AbortSignal
): Promise<TelegramUpdate[]> {
  const settings = await getSettings();
  if (!settings?.telegramBotToken) {
    throw new Error('Telegram bot token not configured');
  }

  const url = `https://api.telegram.org/bot${settings.telegramBotToken}/getUpdates`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      offset,
      timeout: 30,
      allowed_updates: ['message']
    }),
    signal
  });

  const data: TelegramResponse<TelegramUpdate[]> = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description ?? 'Unknown error'}`);
  }

  return data.result;
}

export async function testConnection(): Promise<boolean> {
  try {
    const settings = await getSettings();
    if (!settings?.telegramBotToken) {
      return false;
    }

    const result = await telegramApi<{ id: number; username: string }>('getMe');
    console.log('Telegram bot connected:', result.username);
    return true;
  } catch (error) {
    console.error('Telegram connection test failed:', error);
    return false;
  }
}
