CREATE TABLE `case_progress` (
	`user_id` text NOT NULL,
	`case_id` text NOT NULL,
	`mode` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `case_id`, `mode`)
);
