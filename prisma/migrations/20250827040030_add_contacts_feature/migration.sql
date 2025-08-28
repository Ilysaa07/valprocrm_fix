/*
  Warnings:

  - You are about to drop the column `company` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `socialMedia` on the `contacts` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `contacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `contacts` DROP COLUMN `company`,
    DROP COLUMN `email`,
    DROP COLUMN `name`,
    DROP COLUMN `phone`,
    DROP COLUMN `socialMedia`,
    ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `clientStatus` ENUM('PROSPECT', 'ACTIVE', 'INACTIVE', 'COMPLETED') NOT NULL DEFAULT 'PROSPECT',
    ADD COLUMN `companyName` VARCHAR(191) NULL,
    ADD COLUMN `createdById` VARCHAR(191) NOT NULL,
    ADD COLUMN `followUpDate` DATETIME(3) NULL,
    ADD COLUMN `fullName` VARCHAR(191) NOT NULL,
    ADD COLUMN `instagram` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `serviceType` VARCHAR(191) NULL,
    ADD COLUMN `updatedById` VARCHAR(191) NULL,
    ADD COLUMN `whatsappNumber` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `contact_activities` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `oldData` TEXT NULL,
    `newData` TEXT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_activities_contactId_idx`(`contactId`),
    INDEX `contact_activities_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `contacts_createdById_idx` ON `contacts`(`createdById`);

-- CreateIndex
CREATE INDEX `contacts_updatedById_idx` ON `contacts`(`updatedById`);

-- CreateIndex
CREATE INDEX `contacts_clientStatus_idx` ON `contacts`(`clientStatus`);

-- CreateIndex
CREATE INDEX `contacts_companyName_idx` ON `contacts`(`companyName`);

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_activities` ADD CONSTRAINT `contact_activities_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_activities` ADD CONSTRAINT `contact_activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
