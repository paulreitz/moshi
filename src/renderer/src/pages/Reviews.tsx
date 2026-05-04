import { Component, createResource, createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import { toast } from '../stores/toast';
import type { AppEvent, ReviewWithContext } from '../../../shared/types';

export const Reviews: Component = () => {
  const [showUnreadOnly, setShowUnreadOnly] = createSignal(true);
  const [selectedReview, setSelectedReview] = createSignal<ReviewWithContext | null>(null);
  const [isMarkingRead, setIsMarkingRead] = createSignal(false);
  const [reviews, { refetch }] = createResource(
    () => showUnreadOnly(),
    (unreadOnly) => unreadOnly ? window.api.reviews.unread() : window.api.reviews.list()
  );

  // Subscribe to app events for real-time updates
  onMount(() => {
    const unsubscribe = window.api.events.onAppEvent((event: AppEvent) => {
      if (event.type === 'review:created') {
        refetch();
      }
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const handleMarkSeen = async (review: ReviewWithContext) => {
    setIsMarkingRead(true);
    try {
      await window.api.reviews.markSeen(review.id);
      await refetch();
      if (selectedReview()?.id === review.id) {
        setSelectedReview(null);
      }
    } catch (error) {
      console.error('Failed to mark review as read:', error);
      toast.error('Failed to mark review as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const gradeVariant = (grade: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
      'excellent': 'success',
      'good': 'info',
      'fair': 'warning',
      'needs_work': 'error'
    };
    return variants[grade] ?? 'default';
  };

  const gradeLabel = (grade: string) => {
    const labels: Record<string, string> = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'needs_work': 'Needs Work'
    };
    return labels[grade] ?? grade;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelect = (review: ReviewWithContext) => {
    if (selectedReview()?.id === review.id) {
      setSelectedReview(null);
    } else {
      setSelectedReview(review);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Review feedback on your Japanese responses"
        actions={
          <Button
            variant={showUnreadOnly() ? 'primary' : 'secondary'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly())}
          >
            {showUnreadOnly() ? 'Show All' : 'Show Unread Only'}
          </Button>
        }
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reviews List */}
        <div>
          <Show
            when={reviews() && reviews()!.length > 0}
            fallback={
              <Card>
                <CardContent>
                  <div class="text-center py-8">
                    <p class="text-text-secondary">
                      {showUnreadOnly()
                        ? 'No unread reviews. Great job staying on top of your feedback!'
                        : 'No reviews yet. Complete some conversations to get feedback!'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <div class="space-y-2">
              <For each={reviews()}>
                {(review) => (
                  <Card
                    class={`cursor-pointer transition-colors ${
                      selectedReview()?.id === review.id
                        ? 'ring-2 ring-accent bg-bg-hover'
                        : 'hover:bg-bg-hover'
                    }`}
                    onClick={() => handleSelect(review)}
                  >
                    <CardContent>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <Badge variant={gradeVariant(review.grade) as any}>
                            {gradeLabel(review.grade)}
                          </Badge>
                          <Show when={!review.isSeen}>
                            <span class="w-2 h-2 rounded-full bg-accent" />
                          </Show>
                        </div>
                        <span class="text-sm text-text-muted">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p class="text-sm text-text-secondary truncate">
                        {review.personaName}
                      </p>
                      <p class="text-text-primary truncate mt-1">
                        {review.message.contentJa}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Review Detail */}
        <div>
          <Show
            when={selectedReview()}
            keyed
            fallback={
              <Card>
                <CardContent>
                  <div class="text-center py-12">
                    <p class="text-text-muted">
                      Select a review to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            {(review) => (
                <div class="space-y-4">
                  {/* Review Header */}
                  <Card>
                    <CardHeader>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <CardTitle>Review</CardTitle>
                          <Badge variant={gradeVariant(review.grade) as any}>
                            {gradeLabel(review.grade)}
                          </Badge>
                        </div>
                        <Show when={!review.isSeen}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkSeen(review)}
                            loading={isMarkingRead()}
                          >
                            Mark as Read
                          </Button>
                        </Show>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div class="text-sm text-text-muted">
                        <span>Conversation with </span>
                        <span class="text-text-primary font-medium">{review.personaName}</span>
                        <span> on {formatDate(review.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Conversation Context */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div class="space-y-4">
                        {/* Agent Message */}
                        <Show when={review.agentMessage}>
                          <div class="p-3 rounded-lg bg-bg-tertiary mr-8">
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-xs font-medium text-text-muted uppercase">
                                {review.personaName}
                              </span>
                            </div>
                            <p class="text-text-primary text-lg mb-1">
                              {review.agentMessage!.contentJa}
                            </p>
                            <Show when={review.agentMessage!.contentEn}>
                              <p class="text-sm text-text-secondary italic">
                                {review.agentMessage!.contentEn}
                              </p>
                            </Show>
                          </div>
                        </Show>

                        {/* User Message */}
                        <div class="p-3 rounded-lg bg-accent/10 ml-8">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-text-muted uppercase">
                              You
                            </span>
                          </div>
                          <p class="text-text-primary text-lg mb-1">
                            {review.message.contentJa}
                          </p>
                          <Show when={review.message.contentEn}>
                            <p class="text-sm text-text-secondary italic">
                              {review.message.contentEn}
                            </p>
                          </Show>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feedback */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div class="space-y-4">
                        <div>
                          <p class="text-text-primary">{review.feedback}</p>
                        </div>
                        <Show when={review.grammarNotes}>
                          <div>
                            <p class="text-sm font-medium text-text-secondary mb-1">
                              Grammar Notes
                            </p>
                            <p class="text-text-primary">{review.grammarNotes}</p>
                          </div>
                        </Show>
                        <Show when={review.vocabularyNotes}>
                          <div>
                            <p class="text-sm font-medium text-text-secondary mb-1">
                              Vocabulary Notes
                            </p>
                            <p class="text-text-primary">{review.vocabularyNotes}</p>
                          </div>
                        </Show>
                      </div>
                    </CardContent>
                  </Card>
                </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
};
