CREATE TABLE `learning_answers` (
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`correct` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `question_id`)
);
--> statement-breakpoint
CREATE TABLE `learning_favorites` (
	`user_id` text NOT NULL,
	`muscle_key` text NOT NULL,
	PRIMARY KEY(`user_id`, `muscle_key`)
);
