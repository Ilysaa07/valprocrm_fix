/*
  Warnings:

  - You are about to drop the column `issuedById` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `issuedToId` on the `invoices` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(7))`.
  - Added the required column `creatorId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_issuedById_fkey`;

-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_issuedToId_fkey`;

-- DropIndex
DROP INDEX `invoices_issuedById_fkey` ON `invoices`;

-- DropIndex
DROP INDEX `invoices_issuedToId_fkey` ON `invoices`;

-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `taxAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `invoices` DROP COLUMN `issuedById`,
    DROP COLUMN `issuedToId`,
    ADD COLUMN `companyDetails` JSON NULL,
    ADD COLUMN `companyLogo` VARCHAR(191) NULL,
    ADD COLUMN `creatorId` VARCHAR(191) NOT NULL,
    ADD COLUMN `customColors` JSON NULL,
    ADD COLUMN `customTemplate` TEXT NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `paymentDetails` JSON NULL,
    ADD COLUMN `pdfUrl` VARCHAR(191) NULL,
    ADD COLUMN `recipientId` VARCHAR(191) NOT NULL,
    ADD COLUMN `templateType` ENUM('DEFAULT', 'PROFESSIONAL', 'MINIMAL', 'MODERN', 'CUSTOM') NOT NULL DEFAULT 'DEFAULT',
    MODIFY `status` ENUM('DRAFT', 'PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX `invoices_creatorId_fkey` ON `invoices`(`creatorId`);

-- CreateIndex
CREATE INDEX `invoices_recipientId_fkey` ON `invoices`(`recipientId`);

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
