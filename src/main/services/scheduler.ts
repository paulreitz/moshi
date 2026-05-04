import { getDatabase, schema } from '../database';
import { eq } from 'drizzle-orm';
import { startPolling, stopPolling } from './telegram';
import {
  startNewConversation,
  setupMessageHandler,
  isWaitingForReply
} from './conversation';
import {
  emitSchedulerStarted,
  emitSchedulerStopped,
  emitNextMessage
} from './events';
import { setSchedulerStatus } from './tray';

interface SchedulerStatus {
  isRunning: boolean;
  nextMessageAt: Date | null;
}

let isRunning = false;
let nextMessageAt: Date | null = null;
let schedulerTimeout: NodeJS.Timeout | null = null;

async function getSettings() {
  const db = getDatabase();
  const result = await db.select().from(schema.settings).limit(1);
  return result[0] ?? null;
}

function getRandomInterval(minMinutes: number, maxMinutes: number): number {
  const minMs = minMinutes * 60 * 1000;
  const maxMs = maxMinutes * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function isWithinActiveHours(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Handle overnight ranges (e.g., 22:00 to 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function getMsUntilActiveHours(startTime: string, endTime: string): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  let minutesUntilStart: number;

  // Handle overnight ranges
  if (startMinutes > endMinutes) {
    // If we're before the end time (early morning), wait until start time today
    if (currentMinutes < endMinutes) {
      minutesUntilStart = startMinutes - currentMinutes;
    } else if (currentMinutes >= startMinutes) {
      // We're already in active hours
      return 0;
    } else {
      // We're between end and start, wait until start
      minutesUntilStart = startMinutes - currentMinutes;
    }
  } else {
    // Normal range (same day)
    if (currentMinutes < startMinutes) {
      minutesUntilStart = startMinutes - currentMinutes;
    } else if (currentMinutes >= endMinutes) {
      // Past end time, wait until tomorrow's start
      minutesUntilStart = (24 * 60 - currentMinutes) + startMinutes;
    } else {
      // We're in active hours
      return 0;
    }
  }

  return minutesUntilStart * 60 * 1000;
}

async function scheduleNextMessage(): Promise<void> {
  if (!isRunning) return;

  const settings = await getSettings();
  if (!settings) {
    console.error('Cannot schedule: settings not found');
    stop();
    return;
  }

  let interval = getRandomInterval(
    settings.minIntervalMinutes,
    settings.maxIntervalMinutes
  );

  // Check if the scheduled time would be within active hours
  const scheduledTime = new Date(Date.now() + interval);
  const scheduledMinutes = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();

  const start = parseTime(settings.activeStartTime);
  const end = parseTime(settings.activeEndTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Check if scheduled time is outside active hours
  let isScheduledTimeActive: boolean;
  if (startMinutes > endMinutes) {
    // Overnight range
    isScheduledTimeActive = scheduledMinutes >= startMinutes || scheduledMinutes < endMinutes;
  } else {
    isScheduledTimeActive = scheduledMinutes >= startMinutes && scheduledMinutes < endMinutes;
  }

  if (!isScheduledTimeActive) {
    // Schedule for start of next active period instead
    const msUntilActive = getMsUntilActiveHours(settings.activeStartTime, settings.activeEndTime);
    if (msUntilActive > 0) {
      // Add a small random offset (1-10 minutes) after active hours start
      const randomOffset = Math.floor(Math.random() * 10 * 60 * 1000) + 60000;
      interval = msUntilActive + randomOffset;
      console.log('Scheduled time outside active hours, waiting until active period');
    }
  }

  nextMessageAt = new Date(Date.now() + interval);
  emitNextMessage(nextMessageAt);
  setSchedulerStatus(true, nextMessageAt);

  console.log(
    `Next message scheduled for ${nextMessageAt.toLocaleTimeString()} ` +
    `(in ${Math.round(interval / 60000)} minutes)`
  );

  schedulerTimeout = setTimeout(async () => {
    await sendScheduledMessage();
  }, interval);
}

async function sendScheduledMessage(): Promise<void> {
  if (!isRunning) return;

  const settings = await getSettings();
  if (!settings) {
    await scheduleNextMessage();
    return;
  }

  // Double-check we're within active hours (in case computer was asleep)
  if (!isWithinActiveHours(settings.activeStartTime, settings.activeEndTime)) {
    console.log('Outside active hours, rescheduling...');
    await scheduleNextMessage();
    return;
  }

  // Don't send if still waiting for a reply
  if (isWaitingForReply()) {
    console.log('Still waiting for reply, rescheduling...');
    await scheduleNextMessage();
    return;
  }

  try {
    const result = await startNewConversation();
    if (result) {
      console.log(`Sent message: ${result.japanese}`);
    } else {
      console.error('Failed to start conversation');
    }
  } catch (error) {
    console.error('Error sending scheduled message:', error);
  }

  // Schedule the next message
  await scheduleNextMessage();
}

export async function start(): Promise<void> {
  if (isRunning) {
    console.log('Scheduler already running');
    return;
  }

  const settings = await getSettings();
  if (!settings?.llmEndpoint || !settings?.llmModel) {
    throw new Error('LLM not configured');
  }
  if (!settings?.telegramBotToken || !settings?.telegramChatId) {
    throw new Error('Telegram not configured');
  }

  // Check for active personas
  const db = getDatabase();
  const activePersonas = await db
    .select()
    .from(schema.personas)
    .where(eq(schema.personas.isActive, true));

  if (activePersonas.length === 0) {
    throw new Error('No active personas');
  }

  console.log('Starting scheduler...');

  isRunning = true;
  emitSchedulerStarted();
  setSchedulerStatus(true);

  // Set up message handler for replies
  setupMessageHandler();

  // Start Telegram polling
  startPolling();

  // Schedule first message
  await scheduleNextMessage();

  // Update settings to mark as active
  const currentSettings = await db.select().from(schema.settings).limit(1);
  if (currentSettings.length > 0) {
    await db
      .update(schema.settings)
      .set({ isActive: true })
      .where(eq(schema.settings.id, currentSettings[0].id));
  }

  console.log('Scheduler started');
}

export function stop(): void {
  if (!isRunning) {
    console.log('Scheduler not running');
    return;
  }

  console.log('Stopping scheduler...');

  isRunning = false;
  nextMessageAt = null;
  emitSchedulerStopped();
  setSchedulerStatus(false);

  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }

  // Stop Telegram polling
  stopPolling();

  // Update settings
  getDatabase()
    .update(schema.settings)
    .set({ isActive: false })
    .then(() => {
      console.log('Scheduler stopped');
    })
    .catch((error) => {
      console.error('Failed to update settings:', error);
    });
}

export function getStatus(): SchedulerStatus {
  return {
    isRunning,
    nextMessageAt
  };
}

export function isSchedulerRunning(): boolean {
  return isRunning;
}
