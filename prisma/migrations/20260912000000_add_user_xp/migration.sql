-- Adds the xp column that V2's XP/Levels system is built on.
ALTER TABLE `User` ADD COLUMN `xp` INTEGER NOT NULL DEFAULT 0;
