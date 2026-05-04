import { Component, createResource, createSignal, createEffect, Show } from 'solid-js';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Select, Button, Toggle } from '../components/ui';
import { toast } from '../stores/toast';

export const Settings: Component = () => {
  const [settings, { refetch }] = createResource(() => window.api.settings.get());
  const [models, setModels] = createSignal<string[]>([]);
  const [isSaving, setIsSaving] = createSignal(false);
  const [isFetchingModels, setIsFetchingModels] = createSignal(false);

  // Form state
  const [llmEndpoint, setLlmEndpoint] = createSignal('');
  const [llmApiKey, setLlmApiKey] = createSignal('');
  const [llmModel, setLlmModel] = createSignal('');
  const [telegramBotToken, setTelegramBotToken] = createSignal('');
  const [telegramChatId, setTelegramChatId] = createSignal('');
  const [jlptLevel, setJlptLevel] = createSignal('N5');
  const [useKanji, setUseKanji] = createSignal(false);
  const [minInterval, setMinInterval] = createSignal(30);
  const [maxInterval, setMaxInterval] = createSignal(120);
  const [activeStartTime, setActiveStartTime] = createSignal('09:00');
  const [activeEndTime, setActiveEndTime] = createSignal('21:00');

  // Initialize form with settings
  createEffect(() => {
    const s = settings();
    if (s) {
      setLlmEndpoint(s.llmEndpoint);
      setLlmApiKey(s.llmApiKey ?? '');
      setLlmModel(s.llmModel);
      setTelegramBotToken(s.telegramBotToken);
      setTelegramChatId(s.telegramChatId);
      setJlptLevel(s.jlptLevel);
      setUseKanji(s.useKanji);
      setMinInterval(s.minIntervalMinutes);
      setMaxInterval(s.maxIntervalMinutes);
      setActiveStartTime(s.activeStartTime);
      setActiveEndTime(s.activeEndTime);
    }
  });

  const handleFetchModels = async () => {
    const endpoint = llmEndpoint();
    if (!endpoint) return;

    setIsFetchingModels(true);
    try {
      const fetchedModels = await window.api.llm.fetchModels(endpoint, llmApiKey() || undefined);
      setModels(fetchedModels);
      if (fetchedModels.length > 0) {
        // Auto-select current model if in list, otherwise select first model
        const currentModel = llmModel();
        if (!currentModel || !fetchedModels.includes(currentModel)) {
          setLlmModel(fetchedModels[0]);
        }
        toast.success(`Fetched ${fetchedModels.length} models`);
      } else {
        toast.warning('No models found');
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to fetch models. Check the endpoint and API key.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.api.settings.update({
        llmEndpoint: llmEndpoint(),
        llmApiKey: llmApiKey() || null,
        llmModel: llmModel(),
        telegramBotToken: telegramBotToken(),
        telegramChatId: telegramChatId(),
        jlptLevel: jlptLevel(),
        useKanji: useKanji(),
        minIntervalMinutes: minInterval(),
        maxIntervalMinutes: maxInterval(),
        activeStartTime: activeStartTime(),
        activeEndTime: activeEndTime()
      });
      await refetch();
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const jlptOptions = [
    { value: 'N5', label: 'N5 - Beginner' },
    { value: 'N4', label: 'N4 - Elementary' },
    { value: 'N3', label: 'N3 - Intermediate' },
    { value: 'N2', label: 'N2 - Upper Intermediate' },
    { value: 'N1', label: 'N1 - Advanced' }
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your Japanese practice agent"
        actions={
          <Button onClick={handleSave} loading={isSaving()}>
            Save Changes
          </Button>
        }
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: API Configuration */}
        <div class="space-y-6">
          {/* LLM Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>LLM Configuration</CardTitle>
              <CardDescription>
                Configure the language model API for message generation and evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <Input
                  label="API Endpoint"
                  placeholder="http://localhost:11434/v1"
                  value={llmEndpoint()}
                  onInput={(e) => setLlmEndpoint(e.currentTarget.value)}
                />
                <Input
                  label="API Key (optional)"
                  type="password"
                  placeholder="sk-..."
                  value={llmApiKey()}
                  onInput={(e) => setLlmApiKey(e.currentTarget.value)}
                />
                <div class="flex gap-2 items-end">
                  <div class="flex-1">
                    <Show
                      when={models().length > 0}
                      fallback={
                        <Input
                          label="Model"
                          placeholder="Enter model name or fetch models"
                          value={llmModel()}
                          onInput={(e) => setLlmModel(e.currentTarget.value)}
                        />
                      }
                    >
                      <Select
                        label="Model"
                        options={models().map(m => ({ value: m, label: m }))}
                        value={llmModel()}
                        onChange={(e) => setLlmModel(e.currentTarget.value)}
                      />
                    </Show>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleFetchModels}
                    disabled={!llmEndpoint()}
                    loading={isFetchingModels()}
                  >
                    Fetch Models
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telegram Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Telegram Configuration</CardTitle>
              <CardDescription>
                Connect your Telegram bot to send and receive messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <Input
                  label="Bot Token"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegramBotToken()}
                  onInput={(e) => setTelegramBotToken(e.currentTarget.value)}
                />
                <Input
                  label="Chat ID"
                  placeholder="Your Telegram chat ID"
                  value={telegramChatId()}
                  onInput={(e) => setTelegramChatId(e.currentTarget.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Practice Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Practice Settings</CardTitle>
              <CardDescription>
                Configure your Japanese practice preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <Select
                  label="JLPT Level"
                  options={jlptOptions}
                  value={jlptLevel()}
                  onChange={(e) => setJlptLevel(e.currentTarget.value)}
                />
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm font-medium text-text-secondary">Kanji Usage</span>
                  <Toggle
                    checked={useKanji()}
                    onChange={setUseKanji}
                    label="Use kanji in messages (even at lower levels)"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Interval (minutes)"
                    type="number"
                    min="1"
                    value={minInterval()}
                    onInput={(e) => setMinInterval(parseInt(e.currentTarget.value) || 30)}
                  />
                  <Input
                    label="Max Interval (minutes)"
                    type="number"
                    min="1"
                    value={maxInterval()}
                    onInput={(e) => setMaxInterval(parseInt(e.currentTarget.value) || 120)}
                  />
                </div>
                <p class="text-sm text-text-muted">
                  Messages will be sent at random intervals between {minInterval()} and {maxInterval()} minutes.
                </p>
                <div class="grid grid-cols-2 gap-4">
                  <Input
                    label="Active Hours Start"
                    type="time"
                    value={activeStartTime()}
                    onInput={(e) => setActiveStartTime(e.currentTarget.value)}
                  />
                  <Input
                    label="Active Hours End"
                    type="time"
                    value={activeEndTime()}
                    onInput={(e) => setActiveEndTime(e.currentTarget.value)}
                  />
                </div>
                <p class="text-sm text-text-muted">
                  Messages will only be sent between {activeStartTime()} and {activeEndTime()}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
