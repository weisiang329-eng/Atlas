CREATE TABLE `industry_metric` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`industry_id` text NOT NULL,
	`metric_key` text NOT NULL,
	`label` text NOT NULL,
	`kind` text DEFAULT 'price' NOT NULL,
	`observation_date` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`note` text,
	`source_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`industry_id`) REFERENCES `industry`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `source`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `industry_metric_series_date_unq` ON `industry_metric` (`industry_id`,`metric_key`,`observation_date`);--> statement-breakpoint
CREATE INDEX `industry_metric_industry_key_idx` ON `industry_metric` (`industry_id`,`metric_key`);