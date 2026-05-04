import { Notification, BrowserWindow } from 'electron';
import { getDatabase, schema } from '../database';
import { eq } from 'drizzle-orm';
import { emitEvent } from './events';
import iconPath from '../../../resources/icon.png?asset';

function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    'excellent': 'Excellent',
    'good': 'Good',
    'fair': 'Fair',
    'needs_work': 'Needs Work'
  };
  return labels[grade] ?? grade;
}

export async function showReviewNotification(
  reviewId: number,
  conversationId: number
): Promise<void> {
  // Check if notifications are supported
  if (!Notification.isSupported()) {
    console.log('Notifications not supported on this platform');
    return;
  }

  // Get review details from database
  const db = getDatabase();
  const reviews = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.id, reviewId))
    .limit(1);

  if (reviews.length === 0) {
    console.error('Review not found for notification:', reviewId);
    return;
  }

  const review = reviews[0];
  const gradeLabel = getGradeLabel(review.grade);

  const notification = new Notification({
    title: 'Review Ready',
    body: `Your response was graded: ${gradeLabel}`,
    icon: iconPath
  });

  notification.on('click', () => {
    // Show and focus the window
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();

      // Emit navigation event to go to reviews page
      emitEvent({ type: 'navigate', path: '/reviews' });
    }
  });

  notification.show();
}
