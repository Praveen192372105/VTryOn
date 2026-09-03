-- =============================================================================
-- V Try-On Platform — Core MySQL 8.x Relational Database Schema
-- Database: vtryon
-- Storage Engine: InnoDB
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Source of Truth: Alembic Migration (001_create_core_v1_schema.py)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `vtryon`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `vtryon`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table structure for users
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_public_id` (`public_id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_public_id` (`public_id`),
  KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table structure for auth_sessions
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `auth_sessions`;
CREATE TABLE `auth_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `refresh_token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME(6) NOT NULL,
  `revoked_at` DATETIME(6) DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auth_sessions_public_id` (`public_id`),
  UNIQUE KEY `uq_auth_sessions_refresh_token_hash` (`refresh_token_hash`),
  KEY `ix_auth_sessions_public_id` (`public_id`),
  KEY `ix_auth_sessions_user_id` (`user_id`),
  KEY `ix_sessions_user_active` (`user_id`, `revoked_at`, `expires_at`),
  CONSTRAINT `fk_auth_sessions_user_id_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table structure for uploads
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `uploads`;
CREATE TABLE `uploads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `kind` VARCHAR(32) NOT NULL DEFAULT 'person',
  `original_name` VARCHAR(255) NOT NULL,
  `storage_key` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(64) NOT NULL,
  `size_bytes` BIGINT UNSIGNED NOT NULL,
  `width` INT DEFAULT NULL,
  `height` INT DEFAULT NULL,
  `sha256` VARCHAR(64) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deleted_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uploads_public_id` (`public_id`),
  UNIQUE KEY `uq_uploads_storage_key` (`storage_key`),
  KEY `ix_uploads_public_id` (`public_id`),
  KEY `ix_uploads_user_id` (`user_id`),
  KEY `ix_uploads_owner_created` (`user_id`, `status`, `created_at`),
  KEY `ix_uploads_hash` (`user_id`, `sha256`),
  CONSTRAINT `fk_uploads_user_id_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table structure for outfits
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `outfits`;
CREATE TABLE `outfits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'upper_body',
  `description` TEXT DEFAULT NULL,
  `image_storage_key` VARCHAR(500) NOT NULL,
  `thumbnail_storage_key` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_outfits_public_id` (`public_id`),
  UNIQUE KEY `uq_outfits_slug` (`slug`),
  KEY `ix_outfits_public_id` (`public_id`),
  KEY `ix_outfits_catalog` (`is_active`, `category`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table structure for favorites (Composite Primary Key)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `outfit_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`, `outfit_id`),
  KEY `ix_favorites_created` (`user_id`, `created_at`),
  KEY `fk_favorites_outfit_id_outfits` (`outfit_id`),
  CONSTRAINT `fk_favorites_user_id_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_outfit_id_outfits` FOREIGN KEY (`outfit_id`) REFERENCES `outfits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table structure for try_on_jobs
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `try_on_jobs`;
CREATE TABLE `try_on_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `person_upload_id` BIGINT UNSIGNED NOT NULL,
  `outfit_id` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'queued',
  `celery_task_id` VARCHAR(100) DEFAULT NULL,
  `error_code` VARCHAR(80) DEFAULT NULL,
  `error_message` VARCHAR(500) DEFAULT NULL,
  `queued_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `started_at` DATETIME(6) DEFAULT NULL,
  `finished_at` DATETIME(6) DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_try_on_jobs_public_id` (`public_id`),
  KEY `ix_try_on_jobs_public_id` (`public_id`),
  KEY `ix_try_on_jobs_user_id` (`user_id`),
  KEY `ix_try_on_jobs_person_upload_id` (`person_upload_id`),
  KEY `ix_try_on_jobs_outfit_id` (`outfit_id`),
  KEY `ix_tryons_queue_state` (`status`, `queued_at`),
  KEY `ix_tryons_owner_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_try_on_jobs_user_id_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_try_on_jobs_person_upload_id_uploads` FOREIGN KEY (`person_upload_id`) REFERENCES `uploads` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_try_on_jobs_outfit_id_outfits` FOREIGN KEY (`outfit_id`) REFERENCES `outfits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table structure for try_on_results (1:0..1 with TryOnJob)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `try_on_results`;
CREATE TABLE `try_on_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) NOT NULL,
  `job_id` BIGINT UNSIGNED NOT NULL,
  `storage_key` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(64) NOT NULL DEFAULT 'image/png',
  `width` INT NOT NULL,
  `height` INT NOT NULL,
  `size_bytes` BIGINT UNSIGNED DEFAULT NULL,
  `sha256` VARCHAR(64) DEFAULT NULL,
  `execution_time_seconds` FLOAT DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_try_on_results_public_id` (`public_id`),
  UNIQUE KEY `uq_try_on_results_job_id` (`job_id`),
  UNIQUE KEY `uq_try_on_results_storage_key` (`storage_key`),
  KEY `ix_try_on_results_public_id` (`public_id`),
  KEY `ix_try_on_results_job_id` (`job_id`),
  CONSTRAINT `fk_try_on_results_job_id_try_on_jobs` FOREIGN KEY (`job_id`) REFERENCES `try_on_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
