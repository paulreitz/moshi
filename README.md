# Moshi - Japanese Language Practice Agent

A desktop application that helps you practice Japanese through interactive Telegram conversations with an AI agent.

## Overview

Moshi sends Japanese messages to you via Telegram at random intervals throughout the day. You reply in Japanese, and the AI evaluates your responses with translations, grammar feedback, and vocabulary suggestions. All conversations are stored locally for later review.

## Features

- **Random Practice Sessions**: Receive Japanese messages at configurable random intervals to simulate natural conversation
- **JLPT Level Support**: Messages are tailored to your Japanese proficiency level (N5 through N1)
- **Multiple Personas**: Practice with different AI personalities to experience varied conversation styles
- **Detailed Feedback**: Get grades, grammar notes, vocabulary suggestions, and natural phrasing tips for each response
- **Conversation History**: Browse all past conversations and review your progress
- **Desktop Notifications**: Get notified when new messages arrive or feedback is ready
- **System Tray**: Runs quietly in the background while you go about your day

## Requirements

- Node.js 18+
- pnpm
- A Telegram account and bot token
- Access to an OpenAI-compatible LLM API

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the prompts to create your bot
3. Copy the bot token provided by BotFather

### 3. Get Your Telegram Chat ID

1. Start a conversation with your newly created bot
2. Send any message to the bot
3. The app will display your chat ID when you configure it, or you can use the Telegram API to retrieve it

### 4. Run the Application

```bash
pnpm dev
```

### 5. Configure Settings

In the app's Settings page, configure:

- **LLM Endpoint**: Your OpenAI-compatible API endpoint (e.g., `https://api.openai.com/v1`)
- **LLM API Key**: Your API key for the LLM service
- **LLM Model**: Select a model from the available options
- **Telegram Bot Token**: The token from BotFather
- **Telegram Chat ID**: Your personal chat ID
- **JLPT Level**: Your current Japanese proficiency level
- **Message Intervals**: Minimum and maximum time between messages (in minutes)

### 6. Create a Persona

Go to the Personas page and create at least one persona for the AI to use. Give it a name and description that defines its personality and conversation style.

### 7. Start Practicing

Toggle the scheduler on from the Dashboard. The app will begin sending you Japanese messages at random intervals within your configured range.

## Usage

### Responding to Messages

When you receive a message from Moshi via Telegram:

1. Read the Japanese message
2. Reply in Japanese directly in Telegram
3. The app will evaluate your response and store the feedback

### Reviewing Feedback

- **Dashboard**: See an overview of your practice status and recent activity
- **Conversations**: Browse all past conversations with full message history
- **Reviews**: View detailed feedback on your responses, filtered by read/unread status

### Manual Fetch

If you've replied to a message but the app hasn't picked it up yet, use the manual fetch button on the Dashboard to check for pending replies.

## Building

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

## Tech Stack

- **UI Framework**: SolidJS
- **Desktop Wrapper**: Electron
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Drizzle ORM
- **APIs**: Telegram Bot API, OpenAI-compatible LLM API
