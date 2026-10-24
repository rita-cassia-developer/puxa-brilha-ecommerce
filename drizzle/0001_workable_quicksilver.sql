CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`orderId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`availableAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int,
	`sessionId` varchar(128) NOT NULL,
	`name` varchar(160),
	`email` varchar(320),
	`phone` varchar(40),
	`source` varchar(120),
	`status` enum('new','contacted','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`consentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(180) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`customerUserId` int,
	`vendorId` int,
	`subtotal` decimal(10,2) NOT NULL,
	`shipping` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`paymentMethod` enum('pix','card','boleto','link') NOT NULL,
	`paymentStatus` enum('pending','approved','rejected','refunded') NOT NULL DEFAULT 'pending',
	`orderStatus` enum('pending','paid','processing','shipped','ready_pickup','completed','cancelled') NOT NULL DEFAULT 'pending',
	`fulfillment` enum('delivery','pickup') NOT NULL DEFAULT 'delivery',
	`customerName` varchar(160) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(40),
	`addressJson` text,
	`referralCode` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`oldPrice` decimal(10,2),
	`stock` int NOT NULL DEFAULT 0,
	`weightGrams` int NOT NULL DEFAULT 1400,
	`imageUrl` varchar(500),
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `referral_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`productId` int,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_links_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`referralLinkId` int,
	`sessionId` varchar(128) NOT NULL,
	`productId` int,
	`landingPath` varchar(500),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`publicCode` varchar(32) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`phone` varchar(40),
	`commissionType` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`commissionValue` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','active','blocked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`),
	CONSTRAINT `vendors_publicCode_unique` UNIQUE(`publicCode`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager','vendor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerUserId_users_id_fk` FOREIGN KEY (`customerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_links` ADD CONSTRAINT `referral_links_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_links` ADD CONSTRAINT `referral_links_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_visits` ADD CONSTRAINT `referral_visits_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_visits` ADD CONSTRAINT `referral_visits_referralLinkId_referral_links_id_fk` FOREIGN KEY (`referralLinkId`) REFERENCES `referral_links`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_visits` ADD CONSTRAINT `referral_visits_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commissions_vendor_idx` ON `commissions` (`vendorId`);--> statement-breakpoint
CREATE INDEX `commissions_order_idx` ON `commissions` (`orderId`);--> statement-breakpoint
CREATE INDEX `leads_vendor_idx` ON `leads` (`vendorId`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_vendor_idx` ON `orders` (`vendorId`);--> statement-breakpoint
CREATE INDEX `orders_payment_idx` ON `orders` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `referral_links_vendor_idx` ON `referral_links` (`vendorId`);--> statement-breakpoint
CREATE INDEX `referral_visits_vendor_idx` ON `referral_visits` (`vendorId`);--> statement-breakpoint
CREATE INDEX `referral_visits_session_idx` ON `referral_visits` (`sessionId`);--> statement-breakpoint
CREATE INDEX `vendors_user_idx` ON `vendors` (`userId`);--> statement-breakpoint
CREATE INDEX `vendors_status_idx` ON `vendors` (`status`);