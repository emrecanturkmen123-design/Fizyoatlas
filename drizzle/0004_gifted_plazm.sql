CREATE TABLE `course_progress` (
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `course_id`)
);
