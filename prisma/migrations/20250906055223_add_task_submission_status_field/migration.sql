/*
  Warnings:

  - You are about to alter the column `status` on the `projects` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(19))` to `Enum(EnumId(21))`.

*/
-- AlterTable
ALTER TABLE `projects` MODIFY `status` ENUM('PLANNING', 'ONGOING', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE `task_submissions` ADD COLUMN `feedback` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISION') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `tasks` MODIFY `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'PENDING_VALIDATION', 'COMPLETED', 'REVISION') NOT NULL DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE `task_submission_files` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `fileType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_submission_files_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `task_submission_files` ADD CONSTRAINT `task_submission_files_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `task_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
