import { BrowserWindow } from 'electron';
import type { AppEvent } from '../../shared/types';
import { showReviewNotification } from './notification';

export function emitEvent(event: AppEvent): void {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    window.webContents.send('app-event', event);
  }
}

export function emitConversationStarted(conversationId: number): void {
  emitEvent({ type: 'conversation:started', conversationId });
}

export function emitConversationCompleted(conversationId: number): void {
  emitEvent({ type: 'conversation:completed', conversationId });
}

export function emitConversationAbandoned(conversationId: number): void {
  emitEvent({ type: 'conversation:abandoned', conversationId });
}

export function emitMessageSent(conversationId: number, messageId: number): void {
  emitEvent({ type: 'message:sent', conversationId, messageId });
}

export function emitMessageReceived(conversationId: number, messageId: number): void {
  emitEvent({ type: 'message:received', conversationId, messageId });
}

export function emitReviewCreated(reviewId: number, conversationId: number): void {
  emitEvent({ type: 'review:created', reviewId, conversationId });
  // Show desktop notification
  showReviewNotification(reviewId, conversationId).catch((error) => {
    console.error('Failed to show review notification:', error);
  });
}

export function emitSchedulerStarted(): void {
  emitEvent({ type: 'scheduler:started' });
}

export function emitSchedulerStopped(): void {
  emitEvent({ type: 'scheduler:stopped' });
}

export function emitNextMessage(nextMessageAt: Date): void {
  emitEvent({ type: 'scheduler:next-message', nextMessageAt });
}
