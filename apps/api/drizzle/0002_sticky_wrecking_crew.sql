CREATE TABLE `relationship` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`relation_type` text NOT NULL,
	`label` text,
	`note` text,
	`source_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`from_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `source`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `relationship_edge_unq` ON `relationship` (`from_id`,`to_id`,`relation_type`);--> statement-breakpoint
CREATE INDEX `relationship_from_idx` ON `relationship` (`from_id`);--> statement-breakpoint
CREATE INDEX `relationship_to_idx` ON `relationship` (`to_id`);