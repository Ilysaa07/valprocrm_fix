/*
  Warnings:

  - You are about to drop the column `created_at` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `invoice_id` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `order_index` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `total_price` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.
  - You are about to drop the column `client_address` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `client_email` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `client_name` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `client_phone` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `company_address` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `company_email` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `company_name` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `company_phone` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_id` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `discount_amount` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `discount_type` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `discount_value` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `invoice_number` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `issue_date` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `tax_type` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `tax_value` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `invoices` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(19))`.
  - You are about to drop the `invoice_subitems` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invoiceId` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clientAddress` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientEmail` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientName` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientPhone` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `invoice_items` DROP FOREIGN KEY `invoice_items_invoice_id_fkey`;

-- DropForeignKey
ALTER TABLE `invoice_subitems` DROP FOREIGN KEY `invoice_subitems_invoice_item_id_fkey`;

-- DropIndex
DROP INDEX `invoices_invoice_number_key` ON `invoices`;

-- AlterTable
ALTER TABLE `invoice_items` DROP COLUMN `created_at`,
    DROP COLUMN `invoice_id`,
    DROP COLUMN `name`,
    DROP COLUMN `order_index`,
    DROP COLUMN `total_price`,
    DROP COLUMN `unit_price`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `invoiceId` VARCHAR(191) NOT NULL,
    ADD COLUMN `total` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `unitPrice` DECIMAL(15, 2) NOT NULL,
    MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `quantity` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `invoices` DROP COLUMN `client_address`,
    DROP COLUMN `client_email`,
    DROP COLUMN `client_name`,
    DROP COLUMN `client_phone`,
    DROP COLUMN `company_address`,
    DROP COLUMN `company_email`,
    DROP COLUMN `company_name`,
    DROP COLUMN `company_phone`,
    DROP COLUMN `created_at`,
    DROP COLUMN `created_by_id`,
    DROP COLUMN `discount_amount`,
    DROP COLUMN `discount_type`,
    DROP COLUMN `discount_value`,
    DROP COLUMN `due_date`,
    DROP COLUMN `invoice_number`,
    DROP COLUMN `issue_date`,
    DROP COLUMN `tax_amount`,
    DROP COLUMN `tax_type`,
    DROP COLUMN `tax_value`,
    DROP COLUMN `total_amount`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `clientAddress` VARCHAR(191) NOT NULL,
    ADD COLUMN `clientEmail` VARCHAR(191) NOT NULL,
    ADD COLUMN `clientName` VARCHAR(191) NOT NULL,
    ADD COLUMN `clientPhone` VARCHAR(191) NOT NULL,
    ADD COLUMN `companyAddress` VARCHAR(191) NOT NULL DEFAULT 'JL. Raya Gading Tutuka No.1758, Soreang Kab.Bandung Jawa Barat Indonesia',
    ADD COLUMN `companyEmail` VARCHAR(191) NOT NULL DEFAULT 'mail@valprointertech.com',
    ADD COLUMN `companyName` VARCHAR(191) NOT NULL DEFAULT 'PT. VALPRO INTERTECH',
    ADD COLUMN `companyPhone` VARCHAR(191) NOT NULL DEFAULT '081399710085',
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NOT NULL,
    ADD COLUMN `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `discountAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `discountType` ENUM('FIXED', 'PERCENTAGE') NOT NULL DEFAULT 'PERCENTAGE',
    ADD COLUMN `discountValue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `dueDate` DATETIME(3) NOT NULL,
    ADD COLUMN `invoiceNumber` VARCHAR(191) NOT NULL DEFAULT 'INV-001',
    ADD COLUMN `shippingAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `taxAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `total` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `status` ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'DRAFT',
    ALTER COLUMN `subtotal` DROP DEFAULT;

-- DropTable
DROP TABLE `invoice_subitems`;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `gender` ENUM('MALE', 'FEMALE') NULL,
    `nikKtp` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `bankAccountNumber` VARCHAR(191) NULL,
    `ewalletNumber` VARCHAR(191) NULL,
    `profilePicture` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'EMPLOYEE', 'CLIENT') NOT NULL DEFAULT 'EMPLOYEE',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_nikKtp_key`(`nikKtp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'PENDING_VALIDATION', 'COMPLETED', 'REVISION') NOT NULL DEFAULT 'NOT_STARTED',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `assignment` ENUM('SPECIFIC', 'ALL_EMPLOYEES') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `assigneeId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,
    `milestoneId` VARCHAR(191) NULL,
    `validationMessage` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tasks_assigneeId_fkey`(`assigneeId`),
    INDEX `tasks_createdById_fkey`(`createdById`),
    INDEX `tasks_projectId_idx`(`projectId`),
    INDEX `tasks_contactId_idx`(`contactId`),
    INDEX `tasks_milestoneId_idx`(`milestoneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_files` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_files_taskId_idx`(`taskId`),
    INDEX `task_files_documentId_idx`(`documentId`),
    INDEX `task_files_uploadedBy_idx`(`uploadedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `documentUrl` VARCHAR(191) NULL,
    `documentName` VARCHAR(191) NULL,
    `documentSize` INTEGER NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `task_submissions_userId_fkey`(`userId`),
    UNIQUE INDEX `task_submissions_taskId_userId_key`(`taskId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `category` ENUM('ORDER_PAYMENT', 'BONUS', 'COMMISSION', 'OTHER_INCOME', 'OFFICE_SUPPLIES', 'UTILITIES', 'RENT', 'MARKETING', 'TRAVEL', 'MEALS', 'EQUIPMENT', 'SOFTWARE', 'TRAINING', 'PAYROLL_EXPENSE', 'OTHER_EXPENSE') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `payrollId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transactions_createdById_fkey`(`createdById`),
    INDEX `transactions_payrollId_idx`(`payrollId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_taskId_fkey`(`taskId`),
    INDEX `notifications_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'SICK', 'LEAVE', 'WFH') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `checkInLatitude` DOUBLE NULL,
    `checkInLongitude` DOUBLE NULL,
    `checkInTime` DATETIME(3) NULL,
    `checkOutTime` DATETIME(3) NULL,

    INDEX `attendance_userId_idx`(`userId`),
    INDEX `attendance_checkInTime_idx`(`checkInTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('SICK', 'LEAVE', 'WFH') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `decidedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminNotes` VARCHAR(191) NULL,

    INDEX `leave_userId_idx`(`userId`),
    INDEX `leave_status_idx`(`status`),
    INDEX `leave_requests_decidedById_fkey`(`decidedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wfh_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `screenshotUrl` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `activityDescription` TEXT NOT NULL,
    `adminNotes` TEXT NULL,
    `latitude` DOUBLE NOT NULL,
    `leaveRequestId` VARCHAR(191) NULL,
    `logTime` DATETIME(3) NOT NULL,
    `longitude` DOUBLE NOT NULL,

    INDEX `wfh_logs_userId_idx`(`userId`),
    INDEX `wfh_logs_logTime_idx`(`logTime`),
    INDEX `wfh_logs_leaveRequestId_fkey`(`leaveRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_feedback` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_feedback_taskId_idx`(`taskId`),
    INDEX `task_feedback_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `type` ENUM('DIRECT', 'GROUP') NOT NULL DEFAULT 'DIRECT',
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_participants` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MODERATOR', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    INDEX `conversation_participants_conversationId_fkey`(`conversationId`),
    INDEX `conversation_participants_userId_fkey`(`userId`),
    UNIQUE INDEX `conversation_participants_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageType` ENUM('TEXT', 'FILE', 'IMAGE', 'VIDEO', 'DELETED') NOT NULL DEFAULT 'TEXT',
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `messages_conversationId_fkey`(`conversationId`),
    INDEX `messages_senderId_fkey`(`senderId`),
    INDEX `messages_createdAt_fkey`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `message_attachments_messageId_fkey`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_reads` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `message_reads_messageId_fkey`(`messageId`),
    INDEX `message_reads_userId_fkey`(`userId`),
    UNIQUE INDEX `message_reads_messageId_userId_key`(`messageId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_deletes` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `message_deletes_messageId_fkey`(`messageId`),
    INDEX `message_deletes_userId_fkey`(`userId`),
    UNIQUE INDEX `message_deletes_messageId_userId_key`(`messageId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_deletes` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conversation_deletes_conversationId_fkey`(`conversationId`),
    INDEX `conversation_deletes_userId_fkey`(`userId`),
    UNIQUE INDEX `conversation_deletes_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `folders` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `folders_parentId_fkey`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `folderId` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
    `sizeBytes` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `currentVerId` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `documents_currentVerId_key`(`currentVerId`),
    INDEX `documents_folderId_idx`(`folderId`),
    INDEX `documents_ownerId_idx`(`ownerId`),
    INDEX `documents_visibility_idx`(`visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_versions` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploadedBy` VARCHAR(191) NOT NULL,

    INDEX `document_versions_documentId_idx`(`documentId`),
    UNIQUE INDEX `document_versions_documentId_version_key`(`documentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,

    INDEX `document_tags_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_acls` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `canView` BOOLEAN NOT NULL DEFAULT true,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,

    INDEX `document_acls_documentId_idx`(`documentId`),
    INDEX `document_acls_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_download_logs` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `downloadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `document_downloads_documentId_idx`(`documentId`),
    INDEX `document_downloads_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_throttle` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastAttempt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_throttle_email_idx`(`email`),
    INDEX `login_throttle_ip_idx`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_limit` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `windowExpiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rate_limit_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `whatsappNumber` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `companyName` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `clientStatus` ENUM('PROSPECT', 'ACTIVE', 'INACTIVE', 'COMPLETED') NOT NULL DEFAULT 'PROSPECT',
    `serviceType` VARCHAR(191) NULL,
    `followUpDate` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `contacts_createdById_idx`(`createdById`),
    INDEX `contacts_updatedById_idx`(`updatedById`),
    INDEX `contacts_clientStatus_idx`(`clientStatus`),
    INDEX `contacts_companyName_idx`(`companyName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('PLANNING', 'ONGOING', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNING',
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `projects_contactId_idx`(`contactId`),
    INDEX `projects_createdById_idx`(`createdById`),
    INDEX `projects_status_idx`(`status`),
    INDEX `projects_startDate_idx`(`startDate`),
    INDEX `projects_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'PT. VALPRO INTERTECH',
    `slogan` VARCHAR(191) NOT NULL DEFAULT 'Business Entity Partner',
    `address` VARCHAR(191) NOT NULL DEFAULT 'JL. Raya Gading Tutuka No.1758, Soreang Kab.Bandung Jawa Barat Indonesia',
    `email` VARCHAR(191) NOT NULL DEFAULT 'mail@valprointertech.com',
    `phone` VARCHAR(191) NOT NULL DEFAULT '081399710085',
    `website` VARCHAR(191) NOT NULL DEFAULT 'valprointertech.com',
    `briAccountNumber` VARCHAR(191) NOT NULL DEFAULT '2105 0100 0365 563',
    `briAccountName` VARCHAR(191) NOT NULL DEFAULT 'a.n PT Valpro Inter Tech',
    `bcaAccountNumber` VARCHAR(191) NOT NULL DEFAULT '4373249575',
    `bcaAccountName` VARCHAR(191) NOT NULL DEFAULT 'a.n PT Valpro Inter Tech',
    `logo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_members` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `project_members_projectId_idx`(`projectId`),
    INDEX `project_members_userId_idx`(`userId`),
    UNIQUE INDEX `project_members_projectId_userId_key`(`projectId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_milestones` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE') NOT NULL DEFAULT 'NOT_STARTED',
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `project_milestones_projectId_idx`(`projectId`),
    INDEX `project_milestones_createdById_idx`(`createdById`),
    INDEX `project_milestones_startDate_idx`(`startDate`),
    INDEX `project_milestones_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `milestones` JSON NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `project_templates_createdById_idx`(`createdById`),
    INDEX `project_templates_serviceType_idx`(`serviceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `basicSalary` DECIMAL(15, 2) NOT NULL,
    `totalAllowances` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `totalDeductions` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `grossSalary` DECIMAL(15, 2) NOT NULL,
    `netSalary` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `paidAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payrolls_employeeId_idx`(`employeeId`),
    INDEX `payrolls_period_idx`(`period`),
    INDEX `payrolls_status_idx`(`status`),
    INDEX `payrolls_createdById_idx`(`createdById`),
    INDEX `payrolls_updatedById_idx`(`updatedById`),
    UNIQUE INDEX `payrolls_employeeId_period_key`(`employeeId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_components` (
    `id` VARCHAR(191) NOT NULL,
    `payrollId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('BASIC_SALARY', 'TRANSPORT_ALLOWANCE', 'MEAL_ALLOWANCE', 'HOUSING_ALLOWANCE', 'MEDICAL_ALLOWANCE', 'BONUS', 'OVERTIME', 'COMMISSION', 'OTHER_ALLOWANCE', 'INCOME_TAX', 'SOCIAL_SECURITY', 'HEALTH_INSURANCE', 'PENSION_FUND', 'LOAN_DEDUCTION', 'LATE_PENALTY', 'ABSENCE_DEDUCTION', 'OTHER_DEDUCTION') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `isTaxable` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payroll_components_payrollId_idx`(`payrollId`),
    INDEX `payroll_components_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `components` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payroll_templates_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `invoice_items_invoiceId_idx` ON `invoice_items`(`invoiceId`);

-- CreateIndex
CREATE UNIQUE INDEX `invoices_invoiceNumber_key` ON `invoices`(`invoiceNumber`);

-- CreateIndex
CREATE INDEX `invoices_createdById_idx` ON `invoices`(`createdById`);

-- CreateIndex
CREATE INDEX `invoices_status_idx` ON `invoices`(`status`);

-- CreateIndex
CREATE INDEX `invoices_date_idx` ON `invoices`(`date`);

-- CreateIndex
CREATE INDEX `invoices_dueDate_idx` ON `invoices`(`dueDate`);

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `project_milestones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_files` ADD CONSTRAINT `task_files_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_files` ADD CONSTRAINT `task_files_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_files` ADD CONSTRAINT `task_files_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submission_files` ADD CONSTRAINT `task_submission_files_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `task_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_decidedById_fkey` FOREIGN KEY (`decidedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wfh_logs` ADD CONSTRAINT `wfh_logs_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `leave_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wfh_logs` ADD CONSTRAINT `wfh_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_feedback` ADD CONSTRAINT `task_feedback_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_feedback` ADD CONSTRAINT `task_feedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_reads` ADD CONSTRAINT `message_reads_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_reads` ADD CONSTRAINT `message_reads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_deletes` ADD CONSTRAINT `message_deletes_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_deletes` ADD CONSTRAINT `message_deletes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_deletes` ADD CONSTRAINT `conversation_deletes_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_deletes` ADD CONSTRAINT `conversation_deletes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_currentVerId_fkey` FOREIGN KEY (`currentVerId`) REFERENCES `document_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_tags` ADD CONSTRAINT `document_tags_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_acls` ADD CONSTRAINT `document_acls_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_acls` ADD CONSTRAINT `document_acls_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_download_logs` ADD CONSTRAINT `document_download_logs_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_download_logs` ADD CONSTRAINT `document_download_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_activities` ADD CONSTRAINT `contact_activities_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_activities` ADD CONSTRAINT `contact_activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_templates` ADD CONSTRAINT `project_templates_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_components` ADD CONSTRAINT `payroll_components_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
