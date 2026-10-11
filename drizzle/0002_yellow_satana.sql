CREATE TABLE `learning_attempts` (
	`user_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`correct` integer NOT NULL,
	`answered_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `attempt_id`)
);
--> statement-breakpoint
CREATE INDEX `learning_attempts_user_time` ON `learning_attempts` (`user_id`,`answered_at`);