CREATE TABLE `forumView` (
	`question_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`question_id`, `user_id`),
	FOREIGN KEY (`question_id`) REFERENCES `forumQuestion`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `forumQuestion` DROP COLUMN `view_count`;