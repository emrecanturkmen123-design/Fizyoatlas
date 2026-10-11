CREATE TABLE `study_notebook` (
	`user_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `entry_id`)
);
