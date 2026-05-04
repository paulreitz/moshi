import { Component, createResource, createSignal, Show, onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import { toast } from '../stores/toast';
import type { AppEvent } from '../../../shared/types';

export const Dashboard: Component = () => {
  const navigate = useNavigate();
  const [settings] = createResource(() => window.api.settings.get());
  const [schedulerStatus, { refetch: refetchSchedulerStatus }] = createResource(() => window.api.scheduler.status());
  const [unreadCount, { refetch: refetchUnreadCount }] = createResource(() => window.api.reviews.unreadCount());
  const [personas] = createResource(() => window.api.personas.list());
  const [isTogglingScheduler, setIsTogglingScheduler] = createSignal(false);

  // Subscribe to app events for real-time updates
  onMount(() => {
    const unsubscribe = window.api.events.onAppEvent((event: AppEvent) => {
      switch (event.type) {
        case 'scheduler:started':
        case 'scheduler:stopped':
        case 'scheduler:next-message':
          refetchSchedulerStatus();
          break;
        case 'review:created':
          refetchUnreadCount();
          break;
        case 'conversation:completed':
          refetchUnreadCount();
          break;
      }
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const handleToggleScheduler = async () => {
    const status = schedulerStatus();
    setIsTogglingScheduler(true);
    try {
      if (status?.isRunning) {
        await window.api.scheduler.stop();
        toast.info('Scheduler stopped');
      } else {
        await window.api.scheduler.start();
        toast.success('Scheduler started');
      }
      // Events will trigger refetch, but we also refetch immediately for responsiveness
      refetchSchedulerStatus();
    } catch (error) {
      console.error('Failed to toggle scheduler:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to toggle scheduler: ${message}`);
    } finally {
      setIsTogglingScheduler(false);
    }
  };

  const isLlmConfigured = () => {
    const s = settings();
    return s?.llmEndpoint && s?.llmModel;
  };

  const isTelegramConfigured = () => {
    const s = settings();
    return s?.telegramBotToken && s?.telegramChatId;
  };

  const hasActivePersona = () => {
    const p = personas();
    return p && p.some(persona => persona.isActive);
  };

  const canStart = () => isLlmConfigured() && isTelegramConfigured() && hasActivePersona();

  const jlptBadgeVariant = (level: string) => {
    const variants: Record<string, 'jlpt-n5' | 'jlpt-n4' | 'jlpt-n3' | 'jlpt-n2' | 'jlpt-n1'> = {
      'N5': 'jlpt-n5',
      'N4': 'jlpt-n4',
      'N3': 'jlpt-n3',
      'N2': 'jlpt-n2',
      'N1': 'jlpt-n1'
    };
    return variants[level] ?? 'jlpt-n5';
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your Japanese practice"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Scheduler Status */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduler</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class={`w-3 h-3 rounded-full ${schedulerStatus()?.isRunning ? 'bg-success' : 'bg-text-muted'}`} />
                <span class="text-text-secondary">
                  {schedulerStatus()?.isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
              <Button
                size="sm"
                variant={schedulerStatus()?.isRunning ? 'secondary' : 'primary'}
                onClick={handleToggleScheduler}
                disabled={!schedulerStatus()?.isRunning && !canStart()}
                loading={isTogglingScheduler()}
              >
                {schedulerStatus()?.isRunning ? 'Stop' : 'Start'}
              </Button>
            </div>
            <Show when={!schedulerStatus()?.isRunning && !canStart()}>
              <p class="mt-2 text-sm text-warning">
                {!isLlmConfigured() && 'Configure LLM. '}
                {!isTelegramConfigured() && 'Configure Telegram. '}
                {!hasActivePersona() && 'Add a persona.'}
              </p>
            </Show>
            <Show when={schedulerStatus()?.nextMessageAt}>
              <p class="mt-2 text-sm text-text-muted">
                Next message at: {new Date(schedulerStatus()!.nextMessageAt!).toLocaleTimeString()}
              </p>
            </Show>
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card>
          <CardHeader>
            <CardTitle>JLPT Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Show when={settings()} fallback={<span class="text-text-muted">Loading...</span>}>
              <Badge variant={jlptBadgeVariant(settings()!.jlptLevel)} size="md">
                {settings()!.jlptLevel}
              </Badge>
              <p class="mt-2 text-sm text-text-muted">
                Messages will match this difficulty level
              </p>
            </Show>
          </CardContent>
        </Card>

        {/* Unread Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-3">
              <span class="text-3xl font-bold text-text-primary">
                {unreadCount() ?? 0}
              </span>
              <span class="text-text-secondary">unread</span>
            </div>
            <Show when={(unreadCount() ?? 0) > 0}>
              <Button size="sm" variant="ghost" class="mt-2" onClick={() => navigate('/reviews')}>
                View Reviews
              </Button>
            </Show>
          </CardContent>
        </Card>

        {/* Active Personas */}
        <Card>
          <CardHeader>
            <CardTitle>Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <Show
              when={personas()}
              fallback={<span class="text-text-muted">Loading...</span>}
            >
              <div class="flex items-center gap-3">
                <span class="text-3xl font-bold text-text-primary">
                  {personas()!.filter(p => p.isActive).length}
                </span>
                <span class="text-text-secondary">active</span>
              </div>
              <p class="mt-2 text-sm text-text-muted">
                {personas()!.length} total personas defined
              </p>
            </Show>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Telegram</span>
                <Show
                  when={settings()?.telegramBotToken}
                  fallback={<Badge variant="warning">Not configured</Badge>}
                >
                  <Badge variant="success">Connected</Badge>
                </Show>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">LLM API</span>
                <Show
                  when={settings()?.llmEndpoint}
                  fallback={<Badge variant="warning">Not configured</Badge>}
                >
                  <Badge variant="success">Connected</Badge>
                </Show>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
