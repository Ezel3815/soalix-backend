-- Defensive: adds `xp` only if it isn't already there, in case the
-- earlier add_user_xp migration didn't fully apply on your database.
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `xp` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `UserAchievement` (
    `user_id` INTEGER NOT NULL,
    `achievement_id` VARCHAR(191) NOT NULL,
    `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`, `achievement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserAchievement`
  ADD CONSTRAINT `UserAchievement_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
