CREATE TABLE IF NOT EXISTS `ActivityEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityEvent_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ActivityEvent`
  ADD CONSTRAINT `ActivityEvent_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
