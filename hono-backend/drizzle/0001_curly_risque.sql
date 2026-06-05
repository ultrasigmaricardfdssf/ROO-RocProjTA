CREATE TABLE `notification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`from_user_id` integer,
	`type` text NOT NULL,
	`ref_id` integer,
	`ref_type` text,
	`message` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `forumFollow` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `forumQuestion`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `userFollow` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`follower_id` integer NOT NULL,
	`following_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_forumQuestion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`tag_id` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`edited_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `forumTag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_forumQuestion`("id", "user_id", "title", "content", "tag_id", "view_count", "created_at", "edited_at") SELECT "id", "user_id", "title", "content", "tag_id", "view_count", "created_at", "edited_at" FROM `forumQuestion`;--> statement-breakpoint
DROP TABLE `forumQuestion`;--> statement-breakpoint
ALTER TABLE `__new_forumQuestion` RENAME TO `forumQuestion`;--> statement-breakpoint
PRAGMA foreign_keys=ON;