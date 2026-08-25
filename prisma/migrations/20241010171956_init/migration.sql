-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `session_code` VARCHAR(191) NULL,
    `activation_code` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `reset_password_code` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `parent_id` INTEGER NULL,
    `by_admin` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('CARDS_DECK', 'PACKAGE_DECK') NOT NULL DEFAULT 'CARDS_DECK',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `public` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order` INTEGER NOT NULL,
    `deck_id` INTEGER NOT NULL,
    `type` ENUM('BASIC', 'CLOZE', 'OCCLUSION') NOT NULL,
    `data` JSON NOT NULL,
    `document_name` VARCHAR(191) NULL,
    `document_title` VARCHAR(191) NULL,
    `front_image_name` VARCHAR(191) NULL,
    `back_image_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Card_document_name_key`(`document_name`),
    UNIQUE INDEX `Card_front_image_name_key`(`front_image_name`),
    UNIQUE INDEX `Card_back_image_name_key`(`back_image_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CardAnswer` (
    `user_id` INTEGER NOT NULL,
    `card_id` INTEGER NOT NULL,
    `answer` ENUM('EASY', 'GOOD', 'HARD', 'AGAIN', 'NONE') NOT NULL,

    PRIMARY KEY (`user_id`, `card_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Code` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Code_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CodeDeck` (
    `code_id` INTEGER NOT NULL,
    `deck_id` INTEGER NOT NULL,

    PRIMARY KEY (`code_id`, `deck_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDeck` (
    `user_id` INTEGER NOT NULL,
    `deck_id` INTEGER NOT NULL,
    `editable` BOOLEAN NOT NULL,
    `sharable` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `share_code` VARCHAR(191) NULL,
    `share_is_editable` BOOLEAN NULL,
    `share_is_sharable` BOOLEAN NULL,

    UNIQUE INDEX `UserDeck_share_code_key`(`share_code`),
    PRIMARY KEY (`user_id`, `deck_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('IMAGE', 'PDF') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Deck` ADD CONSTRAINT `Deck_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `Deck`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_deck_id_fkey` FOREIGN KEY (`deck_id`) REFERENCES `Deck`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_front_image_name_fkey` FOREIGN KEY (`front_image_name`) REFERENCES `Media`(`name`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_back_image_name_fkey` FOREIGN KEY (`back_image_name`) REFERENCES `Media`(`name`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_document_name_fkey` FOREIGN KEY (`document_name`) REFERENCES `Media`(`name`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardAnswer` ADD CONSTRAINT `CardAnswer_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardAnswer` ADD CONSTRAINT `CardAnswer_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `Card`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CodeDeck` ADD CONSTRAINT `CodeDeck_code_id_fkey` FOREIGN KEY (`code_id`) REFERENCES `Code`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CodeDeck` ADD CONSTRAINT `CodeDeck_deck_id_fkey` FOREIGN KEY (`deck_id`) REFERENCES `Deck`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDeck` ADD CONSTRAINT `UserDeck_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDeck` ADD CONSTRAINT `UserDeck_deck_id_fkey` FOREIGN KEY (`deck_id`) REFERENCES `Deck`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
