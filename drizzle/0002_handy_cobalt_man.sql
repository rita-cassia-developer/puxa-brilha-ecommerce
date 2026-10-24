ALTER TABLE `products` ADD `badge` varchar(80);--> statement-breakpoint
ALTER TABLE `products` ADD `accent` varchar(24) DEFAULT 'rose' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `note` varchar(160);