ALTER TABLE `store_sessions` ADD COLUMN `lastActivityAt` timestamp NOT NULL DEFAULT (now());
CREATE INDEX `store_sessions_activity_idx` ON `store_sessions` (`lastActivityAt`);
