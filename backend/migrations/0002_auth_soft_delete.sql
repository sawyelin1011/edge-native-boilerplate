-- Add password hashing + soft-delete support

ALTER TABLE `users` ADD COLUMN `password_hash` text;
ALTER TABLE `users` ADD COLUMN `deleted_at` text;

ALTER TABLE `posts` ADD COLUMN `deleted_at` text;

ALTER TABLE `products` ADD COLUMN `deleted_at` text;
