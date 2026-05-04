CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`llm_endpoint` text DEFAULT '' NOT NULL,
	`llm_api_key` text,
	`llm_model` text DEFAULT '' NOT NULL,
	`telegram_bot_token` text DEFAULT '' NOT NULL,
	`telegram_chat_id` text DEFAULT '' NOT NULL,
	`jlpt_level` text DEFAULT 'N5' NOT NULL,
	`min_interval_minutes` integer DEFAULT 30 NOT NULL,
	`max_interval_minutes` integer DEFAULT 120 NOT NULL,
	`is_active` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`persona_id` integer NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ended_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`role` text NOT NULL,
	`content_ja` text NOT NULL,
	`content_en` text,
	`telegram_message_id` text,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` integer NOT NULL,
	`grade` text NOT NULL,
	`feedback` text NOT NULL,
	`grammar_notes` text,
	`vocabulary_notes` text,
	`is_seen` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
