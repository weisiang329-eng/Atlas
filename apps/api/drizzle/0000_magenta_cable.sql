CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ticker` text NOT NULL,
	`exchange` text NOT NULL,
	`segment` text NOT NULL,
	`country` text NOT NULL,
	`industry_id` text,
	`description` text,
	`headquarters` text,
	`founded_year` integer,
	`website` text,
	`reporting_currency` text DEFAULT 'USD' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`industry_id`) REFERENCES `industry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `company_ticker_idx` ON `company` (`ticker`);--> statement-breakpoint
CREATE INDEX `company_industry_idx` ON `company` (`industry_id`);--> statement-breakpoint
CREATE TABLE `financial_fact` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period_id` integer NOT NULL,
	`concept` text NOT NULL,
	`value` real NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`period_id`) REFERENCES `financial_period`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `source`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_fact_period_concept_unq` ON `financial_fact` (`period_id`,`concept`);--> statement-breakpoint
CREATE TABLE `financial_period` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`period_label` text NOT NULL,
	`period_type` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`fiscal_quarter` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`unit` text DEFAULT 'millions' NOT NULL,
	`report_date` text,
	`source_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `source`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_period_company_label_unq` ON `financial_period` (`company_id`,`period_label`);--> statement-breakpoint
CREATE INDEX `financial_period_company_type_year_idx` ON `financial_period` (`company_id`,`period_type`,`fiscal_year`);--> statement-breakpoint
CREATE TABLE `industry` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sector` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`retrieved_at` text,
	`note` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
