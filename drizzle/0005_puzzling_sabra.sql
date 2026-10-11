CREATE TABLE `quiz_sessions` (
	`user_id` text NOT NULL,
	`session_key` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `session_key`)
);
--> statement-breakpoint
ALTER TABLE `case_progress` ADD `revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `course_progress` ADD `revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_notebook` ADD `revision` integer DEFAULT 0 NOT NULL;