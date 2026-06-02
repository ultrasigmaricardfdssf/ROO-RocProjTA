CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role_id` integer DEFAULT 1 NOT NULL,
	`notified` integer DEFAULT true NOT NULL,
	`description` text,
	`created_at` integer,
	FOREIGN KEY (`role_id`) REFERENCES `userRole`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `forumReaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`forum_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`forum_id`) REFERENCES `forumQuestion`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `forumTag` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`color` text DEFAULT '#AAAAAA',
	`name` text NOT NULL,
	`short` text
);
--> statement-breakpoint
CREATE TABLE `forumQuestion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`tag_id` integer DEFAULT 1 NOT NULL,
	`created_at` integer,
	`edited_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `forumTag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `forumReply` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`is_solution` integer DEFAULT false NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`question_id`) REFERENCES `forumQuestion`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `forumReplyReaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reply_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`reply_id`) REFERENCES `forumReply`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ticketPriority` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`color` text DEFAULT '#AAAAAA',
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ticketReply` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `ticket`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ticket` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`priority_id` integer NOT NULL,
	`requester_id` integer NOT NULL,
	`subject` text NOT NULL,
	`description` text,
	`created_at` integer,
	`resolved_at` integer,
	`resolved_by` integer,
	FOREIGN KEY (`priority_id`) REFERENCES `ticketPriority`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `userRole` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#AAAAAA',
	`canAsk` integer DEFAULT true NOT NULL,
	`canReply` integer DEFAULT true NOT NULL,
	`canDeleteReply` integer DEFAULT false NOT NULL,
	`canPostTicket` integer DEFAULT false NOT NULL,
	`canAcceptTicket` integer DEFAULT false NOT NULL
);
