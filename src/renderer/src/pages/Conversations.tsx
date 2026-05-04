import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import type { Conversation } from '../../../shared/types';

export const Conversations: Component = () => {
  const [conversations] = createResource(() => window.api.conversations.list());
  const [selectedId, setSelectedId] = createSignal<number | null>(null);
  const [selectedConversation] = createResource(
    () => selectedId(),
    (id) => id ? window.api.conversations.get(id) : null
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      'completed': 'success',
      'active': 'warning',
      'abandoned': 'default'
    };
    return variants[status] ?? 'default';
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

  const handleSelect = (conversation: Conversation) => {
    if (selectedId() === conversation.id) {
      setSelectedId(null);
    } else {
      setSelectedId(conversation.id);
    }
  };

  const handleMarkSeen = async () => {
    const conv = selectedConversation();
    if (conv?.review && !conv.review.isSeen) {
      await window.api.reviews.markSeen(conv.review.id);
      // Refetch to update the UI
      setSelectedId(null);
      setTimeout(() => setSelectedId(conv.id), 0);
    }
  };

  return (
    <div>
      <PageHeader
        title="Conversations"
        description="Browse your practice conversation history"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversation List */}
        <div>
          <Show
            when={conversations() && conversations()!.length > 0}
            fallback={
              <Card>
                <CardContent>
                  <div class="text-center py-8">
                    <p class="text-text-secondary">
                      No conversations yet. Start the scheduler to begin practicing!
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <div class="space-y-2">
              <For each={conversations()}>
                {(conversation) => (
                  <Card
                    class={`cursor-pointer transition-colors ${
                      selectedId() === conversation.id
                        ? 'ring-2 ring-accent bg-bg-hover'
                        : 'hover:bg-bg-hover'
                    }`}
                    onClick={() => handleSelect(conversation)}
                  >
                    <CardContent>
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="font-medium text-text-primary">
                            Conversation #{conversation.id}
                          </p>
                          <p class="text-sm text-text-muted">
                            {formatDate(conversation.startedAt)}
                          </p>
                        </div>
                        <Badge variant={statusBadge(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Conversation Detail */}
        <div>
          <Show
            when={selectedConversation()}
            keyed
            fallback={
              <Card>
                <CardContent>
                  <div class="text-center py-12">
                    <p class="text-text-muted">
                      Select a conversation to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            {(conv) => {
              return (
                <div class="space-y-4">
                  {/* Conversation Header */}
                  <Card>
                    <CardHeader>
                      <div class="flex items-center justify-between">
                        <CardTitle>Conversation #{conv.id}</CardTitle>
                        <Badge variant={statusBadge(conv.status)}>
                          {conv.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-text-muted">Persona:</span>
                          <span class="ml-2 text-text-primary">{conv.persona.name}</span>
                        </div>
                        <div>
                          <span class="text-text-muted">Started:</span>
                          <span class="ml-2 text-text-primary">{formatDate(conv.startedAt)}</span>
                        </div>
                        <Show when={conv.endedAt}>
                          <div>
                            <span class="text-text-muted">Ended:</span>
                            <span class="ml-2 text-text-primary">{formatDate(conv.endedAt!)}</span>
                          </div>
                        </Show>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Messages */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div class="space-y-4">
                        <For each={conv.messages}>
                          {(message) => (
                            <div
                              class={`p-3 rounded-lg ${
                                message.role === 'agent'
                                  ? 'bg-bg-tertiary mr-8'
                                  : 'bg-accent/10 ml-8'
                              }`}
                            >
                              <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-medium text-text-muted uppercase">
                                  {message.role === 'agent' ? conv.persona.name : 'You'}
                                </span>
                                <span class="text-xs text-text-muted">
                                  {formatTime(message.sentAt)}
                                </span>
                              </div>
                              <p class="text-text-primary text-lg mb-1">
                                {message.contentJa}
                              </p>
                              <Show when={message.contentEn}>
                                <p class="text-sm text-text-secondary italic">
                                  {message.contentEn}
                                </p>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review */}
                  <Show when={conv.review} keyed>
                    {(review) => (
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
                                  onClick={handleMarkSeen}
                                >
                                  Mark as Read
                                </Button>
                              </Show>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div class="space-y-4">
                              <div>
                                <p class="text-sm font-medium text-text-secondary mb-1">
                                  Feedback
                                </p>
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
                    )}
                  </Show>
                </div>
              );
            }}
          </Show>
        </div>
      </div>
    </div>
  );
};
