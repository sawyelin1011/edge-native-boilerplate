-- GSMFlow core tables and fields

-- Users enhancements
ALTER TABLE `users` ADD COLUMN `balance` real NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD COLUMN `is_email_verified` integer NOT NULL DEFAULT false;
ALTER TABLE `users` ADD COLUMN `email_verified_at` text;
ALTER TABLE `users` ADD COLUMN `two_factor_enabled` integer NOT NULL DEFAULT false;
ALTER TABLE `users` ADD COLUMN `totp_secret_encrypted` text;
ALTER TABLE `users` ADD COLUMN `phone` text;

-- Service providers
CREATE TABLE `service_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`adapter_type` text NOT NULL,
	`api_url` text NOT NULL,
	`credentials_encrypted` text,
	`configuration` text,
	`is_active` integer DEFAULT true NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

-- Services
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`external_service_id` text NOT NULL,
	`service_type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`api_price` real NOT NULL,
	`base_price` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`category` text,
	`is_active` integer DEFAULT true NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `services_provider_external_unique` ON `services` (`provider_id`, `external_service_id`);

-- Orders
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`service_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`price` real NOT NULL,
	`api_price` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`external_order_id` text,
	`payload` text,
	`result` text,
	`failure_reason` text,
	`refunded_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);
CREATE INDEX `orders_status_idx` ON `orders` (`status`);

-- Payments
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`gateway` text NOT NULL,
	`status` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`external_id` text,
	`checkout_url` text,
	`raw` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `payments_user_id_idx` ON `payments` (`user_id`);

-- Plugins
CREATE TABLE `plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`version` text DEFAULT '1.0.0' NOT NULL,
	`config` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

CREATE UNIQUE INDEX `plugins_name_unique` ON `plugins` (`name`);

-- Site settings
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
