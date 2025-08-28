/*
  Warnings:

  - You are about to drop the column `checkInAt` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutAt` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `attendance` table. All the data in the column will be lost.
  - The values [ONTIME,LATE] on the enum `attendance_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `decidedAt` on the `leave_requests` table. All the data in the column will be lost.
  - The values [ANNUAL,PERMIT,OTHER] on the enum `leave_requests_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `date` on the `wfh_logs` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `wfh_logs` table. All the data in the column will be lost.
  - You are about to drop the column `locationNote` on the `wfh_logs` table. All the data in the column will be lost.
  - You are about to drop the column `validationMessage` on the `wfh_logs` table. All the data in the column will be lost.
  - You are about to drop the `attendance_config` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `activityDescription` to the `wfh_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `wfh_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logTime` to the `wfh_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `wfh_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `attendance_checkInAt_idx` ON `attendance`;

-- DropIndex
DROP INDEX `wfh_logs_date_idx` ON `wfh_logs`;

-- AlterTable
ALTER TABLE `attendance` DROP COLUMN `checkInAt`,
    DROP COLUMN `checkOutAt`,
    DROP COLUMN `ipAddress`,
    DROP COLUMN `latitude`,
    DROP COLUMN `longitude`,
    DROP COLUMN `method`,
    ADD COLUMN `checkInLatitude` DOUBLE NULL,
    ADD COLUMN `checkInLongitude` DOUBLE NULL,
    ADD COLUMN `checkInTime` DATETIME(3) NULL,
    ADD COLUMN `checkOutTime` DATETIME(3) NULL,
    MODIFY `status` ENUM('PRESENT', 'ABSENT', 'SICK', 'LEAVE', 'WFH') NOT NULL;

-- AlterTable
ALTER TABLE `leave_requests` DROP COLUMN `decidedAt`,
    ADD COLUMN `adminNotes` VARCHAR(191) NULL,
    MODIFY `type` ENUM('SICK', 'LEAVE', 'WFH') NOT NULL;

-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN `tags` VARCHAR(191) NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE `wfh_logs` DROP COLUMN `date`,
    DROP COLUMN `description`,
    DROP COLUMN `locationNote`,
    DROP COLUMN `validationMessage`,
    ADD COLUMN `activityDescription` TEXT NOT NULL,
    ADD COLUMN `adminNotes` TEXT NULL,
    ADD COLUMN `latitude` DOUBLE NOT NULL,
    ADD COLUMN `leaveRequestId` VARCHAR(191) NULL,
    ADD COLUMN `logTime` DATETIME(3) NOT NULL,
    ADD COLUMN `longitude` DOUBLE NOT NULL;

-- DropTable
DROP TABLE `attendance_config`;

-- CreateTable
CREATE TABLE `office_locations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `radius` INTEGER NOT NULL DEFAULT 50,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendance_checkInTime_idx` ON `attendance`(`checkInTime`);

-- CreateIndex
CREATE INDEX `wfh_logs_logTime_idx` ON `wfh_logs`(`logTime`);

-- CreateIndex
CREATE INDEX `wfh_logs_leaveRequestId_fkey` ON `wfh_logs`(`leaveRequestId`);

-- AddForeignKey
ALTER TABLE `wfh_logs` ADD CONSTRAINT `wfh_logs_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `leave_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
