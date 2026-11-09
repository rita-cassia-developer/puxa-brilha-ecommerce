CREATE TABLE IF NOT EXISTS `store_credentials` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `email` varchar(320) NOT NULL,
  `passwordHash` varchar(255),
  `activationHash` varchar(64),
  `activationExpiresAt` timestamp NULL,
  `failedAttempts` int NOT NULL DEFAULT 0,
  `lockedUntil` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `store_credentials_id` PRIMARY KEY (`id`),
  CONSTRAINT `store_credentials_userId_unique` UNIQUE (`userId`),
  CONSTRAINT `store_credentials_email_unique` UNIQUE (`email`),
  CONSTRAINT `store_credentials_activationHash_unique` UNIQUE (`activationHash`),
  CONSTRAINT `store_credentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_sessions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tokenHash` varchar(64) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `store_sessions_id` PRIMARY KEY (`id`),
  CONSTRAINT `store_sessions_tokenHash_unique` UNIQUE (`tokenHash`),
  CONSTRAINT `store_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  INDEX `store_sessions_user_idx` (`userId`),
  INDEX `store_sessions_expiry_idx` (`expiresAt`)
);
