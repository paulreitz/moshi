# Moshi - Japanese Language Practice Agent

A desktop application that helps users practice Japanese through interactive Telegram conversations with an AI agent.

## Project Overview

Moshi sends Japanese messages to users via Telegram at random intervals. Users reply in Japanese, and the AI evaluates their responses with translations and feedback. All conversations are stored for later review.

## Tech Stack

- **Package Manager**: pnpm
- **UI Framework**: SolidJS
- **Desktop Wrapper**: Electron
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Drizzle ORM
- **APIs**: Telegram Bot API, OpenAI-compatible LLM API

## Code Style Rules

- Use single quotes for all strings
- Use double quotes for JSX/TSX tag attributes
- Use `class` instead of `className` in JSX/TSX
- Place each Drizzle table definition in a separate file
- Use semicolons at the end of statements

## Folder Structure

```
moshi/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Main electron entry point
│   │   ├── services/            # Background services
│   │   │   ├── telegram.ts      # Telegram bot API integration
│   │   │   ├── scheduler.ts     # Random interval message scheduler
│   │   │   ├── llm.ts           # LLM API client
│   │   │   ├── tray.ts          # System tray icon and menu
│   │   │   ├── notification.ts  # Desktop notifications
│   │   │   ├── events.ts        # App event emitter
│   │   │   ├── conversation.ts  # Conversation management
│   │   │   └── windowState.ts   # Window position/size persistence
│   │   └── database/            # Database layer (runs in main process)
│   │       ├── index.ts         # Database connection setup
│   │       ├── schema/          # Drizzle table definitions (one per file)
│   │       │   ├── settings.ts
│   │       │   ├── personas.ts
│   │       │   ├── conversations.ts
│   │       │   ├── messages.ts
│   │       │   └── reviews.ts
│   │       └── migrations/      # Drizzle migration files
│   │
│   ├── preload/                 # Preload scripts & IPC bridge
│   │   ├── index.ts             # Context bridge setup
│   │   └── index.d.ts           # Type definitions for exposed APIs
│   │
│   └── renderer/                # SolidJS UI (renderer process)
│       ├── index.html           # HTML entry point
│       └── src/
│           ├── main.tsx         # App entry point
│           ├── App.tsx          # Root component with routing
│           ├── assets/          # Static assets and styles
│           │   ├── base.css
│           │   └── main.css     # Tailwind imports
│           │
│           ├── components/      # Reusable UI components
│           │   ├── ui/          # Base UI primitives (Button, Input, Card, Spinner, Toast, etc.)
│           │   ├── layout/      # Layout components (Sidebar, Layout, PageHeader)
│           │   ├── settings/    # Settings form components
│           │   ├── conversations/  # Conversation display components
│           │   ├── reviews/     # Review and feedback components
│           │   └── personas/    # Persona management components
│           │
│           ├── pages/           # Route page components
│           │   ├── Dashboard.tsx
│           │   ├── Settings.tsx
│           │   ├── Conversations.tsx
│           │   ├── Reviews.tsx
│           │   └── Personas.tsx
│           │
│           ├── stores/          # SolidJS reactive stores
│           │   ├── settings.ts
│           │   ├── conversations.ts
│           │   ├── personas.ts
│           │   └── toast.ts        # Toast notification state
│           │
│           └── lib/             # Utility functions
│               └── utils.ts
│
├── shared/                      # Shared types between main and renderer
│   └── types/
│       ├── settings.ts
│       ├── persona.ts
│       ├── conversation.ts
│       ├── message.ts
│       ├── review.ts
│       └── ipc.ts               # IPC channel types
│
├── resources/                   # App resources (icons, etc.)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── drizzle.config.ts
├── electron.vite.config.ts      # electron-vite configuration
├── electron-builder.yml         # Electron packaging config
└── claude.md
```

## Database Schema

### settings
- `id` (primary key)
- `llm_endpoint` (string) - LLM API base URL
- `llm_api_key` (string, nullable) - API key for LLM
- `llm_model` (string) - Selected model name
- `telegram_bot_token` (string) - Telegram bot token
- `telegram_chat_id` (string) - User's Telegram chat ID
- `jlpt_level` (string) - N5, N4, N3, N2, or N1
- `use_kanji` (boolean) - Whether to use kanji even at lower JLPT levels
- `min_interval_minutes` (integer) - Minimum time between messages
- `max_interval_minutes` (integer) - Maximum time between messages
- `active_start_time` (string) - Start of active hours (HH:MM format, default "09:00")
- `active_end_time` (string) - End of active hours (HH:MM format, default "21:00")
- `is_active` (boolean) - Whether the scheduler is running

### personas
- `id` (primary key)
- `name` (string) - Persona display name
- `description` (text) - Persona description/personality
- `is_active` (boolean) - Whether this persona can be selected
- `created_at` (timestamp)

### conversations
- `id` (primary key)
- `persona_id` (foreign key -> personas)
- `started_at` (timestamp)
- `ended_at` (timestamp, nullable)
- `status` (string) - 'active', 'completed', 'abandoned'

### messages
- `id` (primary key)
- `conversation_id` (foreign key -> conversations)
- `role` (string) - 'agent' or 'user'
- `content_ja` (text) - Japanese content
- `content_en` (text, nullable) - English translation
- `telegram_message_id` (string, nullable)
- `sent_at` (timestamp)

### reviews
- `id` (primary key)
- `message_id` (foreign key -> messages) - The user message being reviewed
- `grade` (string) - e.g., 'excellent', 'good', 'needs_work'
- `feedback` (text) - Detailed feedback in English
- `grammar_notes` (text, nullable) - Grammar-specific feedback
- `vocabulary_notes` (text, nullable) - Vocabulary-specific feedback
- `is_seen` (boolean) - Whether user has viewed this review
- `created_at` (timestamp)

## Implementation Plan

### Phase 1: Project Setup
- [x] Initialize Electron + Vite + SolidJS project
- [x] Configure Tailwind CSS 4
- [x] Set up SQLite with Drizzle ORM
- [x] Create database schema and run initial migration
- [x] Set up IPC bridge between main and renderer processes

### Phase 2: Core UI
- [x] Create base UI components (Button, Input, Card, Modal, etc.)
- [x] Build layout with sidebar navigation
- [x] Implement Settings page with all configuration options
- [x] Implement Personas page with CRUD operations
- [x] Implement Dashboard with status overview

### Phase 3: Backend Services
- [x] Implement LLM service with model fetching
- [x] Implement Telegram bot service
- [x] Implement message scheduler with random intervals
- [x] Create conversation management logic

### Phase 4: Message Flow
- [x] Agent generates and sends Japanese message via Telegram
- [x] Listen for user replies via Telegram webhook/polling
- [x] Send user reply to LLM for evaluation
- [x] Store conversation, messages, and review in database
- [x] Update UI with new conversation data

### Phase 5: Review System
- [x] Implement Conversations browser page
- [x] Implement Reviews page with unread filter
- [x] Add review detail view with feedback display
- [x] Track "seen" status for reviews

### Phase 6: Polish & Testing
- [x] Add loading states and error handling
- [x] Implement app tray icon for background operation
- [x] Add notifications for new messages
- [x] Window state persistence (position, size, maximized state)
- [x] Active hours scheduling (messages only sent during configured hours)
- [x] Kanji toggle for lower JLPT levels
- [x] Telegram messages prefixed with persona name
- [ ] Avoid repeating LLM messages (see "Next: Duplicate Message Prevention" below)
- [ ] Test full flow end-to-end

## Key IPC Channels

```typescript
// Settings
'settings:get' -> Settings
'settings:update' -> (partial: Partial<Settings>) -> Settings

// Personas
'personas:list' -> Persona[]
'personas:create' -> (data: CreatePersona) -> Persona
'personas:update' -> (id: number, data: Partial<Persona>) -> Persona
'personas:delete' -> (id: number) -> void

// Conversations
'conversations:list' -> Conversation[]
'conversations:get' -> (id: number) -> ConversationWithMessages

// Reviews
'reviews:list' -> Review[]
'reviews:mark-seen' -> (id: number) -> void
'reviews:unread-count' -> number

// LLM
'llm:fetch-models' -> (endpoint: string, apiKey?: string) -> string[]

// Scheduler
'scheduler:start' -> void
'scheduler:stop' -> void
'scheduler:status' -> { isRunning: boolean, nextMessageAt?: Date }

// Telegram polling
'telegram:fetch-updates' -> void  // Manual fetch of pending replies
```

## Message Round Trip

1. The app starts communication by sending the prompt to the LLM, including persona and language level
2. The message is sent to the user over Telegram as `Persona Name: Message`
3. While there are unanswered messages, the app polls the Telegram API for new messages every 5 minutes. If there are no unanswered messages, no need to poll (uses `waitingForReply` state to track which messages have been answered)
4. While there are unanswered messages and the Telegram API isn't being polled, a button should be provided to allow the user to manually fetch any pending replies. The button should be disabled when there are no unanswered messages or when polling is already in progress

## LLM Prompts

### Message Generation Prompt
The agent should generate contextual Japanese messages appropriate to the JLPT level, staying in character as the selected persona. If `use_kanji` is enabled, kanji should be used even at lower levels.

### Evaluation Prompt
The LLM should evaluate the user's Japanese response, providing:
- English translation of the original message
- English translation of the user's reply
- Overall grade
- Grammar feedback
- Vocabulary feedback
- Natural phrasing suggestions

## Window State Persistence

The app remembers window position, size, and maximized state between sessions. State is saved to `window-state.json` in the user data directory. The state is tracked via module-level variables to handle cases where the window is hidden to tray (where `isMaximized()` would return false).

## Scheduler Active Hours

Messages are only sent during configured active hours (default 09:00 - 21:00). The scheduler:
1. Checks if scheduled time falls within active hours
2. If outside active hours, reschedules for the start of the next active period
3. Double-checks active hours before sending (handles computer sleep scenarios)
4. Supports overnight ranges (e.g., 22:00 to 06:00)

## Next: Duplicate Message Prevention

**Problem:** The LLM sometimes generates the same or very similar messages repeatedly.

**Proposed Solution:** Include recent messages in prompt + duplicate detection fallback.

### Implementation Options

#### 1. Track Recent Messages
- Store the last 10-20 agent messages in memory, or query from database (messages from last 7 days)
- Pass these to `generateMessage()` as context

#### 2. Update the System Prompt
- Add a section listing recent messages sent
- Instruct the LLM: "Do not repeat or closely paraphrase any of these recent messages"

#### 3. Duplicate Detection (Fallback)
- After receiving a response, check if it's too similar to recent messages (exact match or high similarity)
- If duplicate detected, regenerate with an additional hint like "Try a different topic or greeting"

#### 4. Add Variety Hints
- Include random topic suggestions or time-of-day context to encourage variety

### Files to Modify
- `src/main/services/conversation.ts` - Query recent agent messages before calling `generateMessage()`
- `src/main/services/llm.ts` - Accept `recentMessages` parameter and include them in the prompt; add duplicate check
