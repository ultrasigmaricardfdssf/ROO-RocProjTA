CREATE TABLE `chatRoom` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer,
	`closed_at` integer,
	`log` text,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chatRoom_title_unique` ON `chatRoom` (`title`);