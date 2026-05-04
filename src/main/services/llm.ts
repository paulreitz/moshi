import { getDatabase, schema } from '../database';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ModelListResponse {
  data: Array<{
    id: string;
  }>;
}

async function getSettings() {
  const db = getDatabase();
  const result = await db.select().from(schema.settings).limit(1);
  return result[0] ?? null;
}

export async function fetchModels(endpoint: string, apiKey?: string): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${endpoint}/models`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: ModelListResponse = await response.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model) => model.id);
    }
    return [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const settings = await getSettings();
  if (!settings?.llmEndpoint || !settings?.llmModel) {
    throw new Error('LLM not configured');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (settings.llmApiKey) {
    headers['Authorization'] = `Bearer ${settings.llmApiKey}`;
  }

  const response = await fetch(`${settings.llmEndpoint}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.llmModel,
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.statusText}`);
  }

  const data: ChatCompletionResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

const JLPT_DESCRIPTIONS: Record<string, string> = {
  'N5': 'basic beginner level, using only simple greetings, basic verbs (います、あります、です), numbers, basic adjectives, and very common nouns. Use only hiragana and katakana, no kanji.',
  'N4': 'elementary level, using simple sentences about daily life, basic て-form, ている, たい form, and common kanji (about 300). Topics include shopping, weather, hobbies.',
  'N3': 'intermediate level, using compound sentences, passive form, causative form, conditionals (たら、ば、なら), and about 650 kanji. Can discuss opinions and experiences.',
  'N2': 'upper-intermediate level, using complex grammar patterns, formal expressions, keigo basics, and about 1000 kanji. Can discuss abstract topics and news.',
  'N1': 'advanced level, using sophisticated expressions, full keigo, literary forms, idioms, and 2000+ kanji. Native-like complexity in all topics.'
};

export async function generateMessage(
  personaName: string,
  personaDescription: string,
  jlptLevel: string,
  useKanji: boolean = false,
  recentMessages: string[] = [],
  conversationHistory: Array<{ role: 'agent' | 'user'; contentJa: string }> = []
): Promise<{ japanese: string; english: string }> {
  const levelDesc = JLPT_DESCRIPTIONS[jlptLevel] ?? JLPT_DESCRIPTIONS['N5'];

  const kanjiInstruction = useKanji
    ? '\n6. Use kanji in your messages, even at lower levels'
    : '';

  const recentMessagesInstruction = recentMessages.length > 0
    ? `\n\nRECENT MESSAGES (do not repeat or closely paraphrase these):\n${recentMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    : '';

  const systemPrompt = `You are a Japanese language practice partner named ${personaName}.
Personality: ${personaDescription}

IMPORTANT RULES:
1. Write ONLY at JLPT ${jlptLevel} level: ${levelDesc}
2. Keep messages short (1-2 sentences for N5-N4, up to 3 for higher levels)
3. Stay in character as ${personaName}
4. Be conversational and natural
5. Ask questions to encourage responses${kanjiInstruction}${recentMessagesInstruction}

Respond with a JSON object in this exact format:
{"japanese": "your message in Japanese", "english": "English translation"}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role === 'agent' ? 'assistant' : 'user',
      content: msg.contentJa
    });
  }

  // If no history, prompt to start a conversation
  if (conversationHistory.length === 0) {
    messages.push({
      role: 'user',
      content: 'Start a new conversation by greeting or asking something casual.'
    });
  } else {
    messages.push({
      role: 'user',
      content: 'Continue the conversation naturally based on what was said.'
    });
  }

  console.log('=== LLM Generate Message Prompt ===');
  messages.forEach((msg, i) => {
    console.log(`[${i}] ${msg.role.toUpperCase()}:`);
    console.log(msg.content);
    console.log('---');
  });

  const response = await chatCompletion(messages);

  console.log('=== LLM Generate Message Response ===');
  console.log(response);
  console.log('===================================');

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(response);
    return {
      japanese: parsed.japanese ?? response,
      english: parsed.english ?? ''
    };
  } catch {
    // If not valid JSON, assume it's just Japanese text
    return {
      japanese: response,
      english: ''
    };
  }
}

export interface EvaluationResult {
  grade: 'excellent' | 'good' | 'fair' | 'needs_work';
  feedback: string;
  grammarNotes: string | null;
  vocabularyNotes: string | null;
  originalEnglish: string;
  replyEnglish: string;
}

export async function evaluateResponse(
  originalJapanese: string,
  userReplyJapanese: string,
  jlptLevel: string
): Promise<EvaluationResult> {
  const systemPrompt = `You are a Japanese language teacher evaluating a student's response.
The student is studying at JLPT ${jlptLevel} level.

Evaluate their response and provide feedback. Be encouraging but honest.

Respond with a JSON object in this exact format:
{
  "grade": "excellent" | "good" | "fair" | "needs_work",
  "feedback": "Overall feedback in English (2-3 sentences)",
  "grammarNotes": "Specific grammar feedback or null if none needed",
  "vocabularyNotes": "Vocabulary suggestions or null if none needed",
  "originalEnglish": "English translation of the original message",
  "replyEnglish": "English translation of the student's reply"
}

Grading criteria:
- excellent: Natural, appropriate, no errors
- good: Minor errors but communication is clear
- fair: Some errors affecting clarity but understandable
- needs_work: Significant errors or inappropriate response`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Original message: ${originalJapanese}\n\nStudent's reply: ${userReplyJapanese}`
    }
  ];

  console.log('=== LLM Evaluate Response Prompt ===');
  messages.forEach((msg, i) => {
    console.log(`[${i}] ${msg.role.toUpperCase()}:`);
    console.log(msg.content);
    console.log('---');
  });

  const response = await chatCompletion(messages);

  console.log('=== LLM Evaluate Response Result ===');
  console.log(response);
  console.log('====================================');

  try {
    const parsed = JSON.parse(response);
    return {
      grade: parsed.grade ?? 'fair',
      feedback: parsed.feedback ?? 'Unable to evaluate response.',
      grammarNotes: parsed.grammarNotes ?? null,
      vocabularyNotes: parsed.vocabularyNotes ?? null,
      originalEnglish: parsed.originalEnglish ?? '',
      replyEnglish: parsed.replyEnglish ?? ''
    };
  } catch {
    return {
      grade: 'fair',
      feedback: 'Unable to parse evaluation. Please try again.',
      grammarNotes: null,
      vocabularyNotes: null,
      originalEnglish: '',
      replyEnglish: ''
    };
  }
}
