-- AlterTable
ALTER TABLE `collections` ADD COLUMN `locked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `first_name` VARCHAR(191) NULL,
    ADD COLUMN `last_name` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `collections_name_idx` ON `collections`(`name`);
