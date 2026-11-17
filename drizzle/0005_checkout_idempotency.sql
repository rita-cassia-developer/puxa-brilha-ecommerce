ALTER TABLE `orders`
  ADD COLUMN `checkoutRequestId` varchar(80) NULL,
  ADD COLUMN `mercadoPagoOrderId` varchar(100) NULL,
  ADD COLUMN `checkoutUrl` varchar(1000) NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_checkoutRequestId_unique` ON `orders` (`checkoutRequestId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_mercadoPagoOrderId_unique` ON `orders` (`mercadoPagoOrderId`);
