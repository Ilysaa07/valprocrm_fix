-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `contactId` VARCHAR(191) NULL,
    ADD COLUMN `milestoneId` VARCHAR(191) NULL,
    ADD COLUMN `projectId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `calendar_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `location` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `category` ENUM('MEETING', 'DEADLINE', 'REMINDER', 'INTERNAL', 'CLIENT', 'PROJECT', 'PERSONAL', 'HOLIDAY') NOT NULL DEFAULT 'MEETING',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'CONFIDENTIAL') NOT NULL DEFAULT 'PRIVATE',
    `recurrenceRule` VARCHAR(191) NULL,
    `recurrenceEnd` DATETIME(3) NULL,
    `parentEventId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,
    `taskId` VARCHAR(191) NULL,
    `milestoneId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `calendar_events_createdById_idx`(`createdById`),
    INDEX `calendar_events_updatedById_idx`(`updatedById`),
    INDEX `calendar_events_startTime_idx`(`startTime`),
    INDEX `calendar_events_endTime_idx`(`endTime`),
    INDEX `calendar_events_category_idx`(`category`),
    INDEX `calendar_events_projectId_idx`(`projectId`),
    INDEX `calendar_events_contactId_idx`(`contactId`),
    INDEX `calendar_events_taskId_idx`(`taskId`),
    INDEX `calendar_events_milestoneId_idx`(`milestoneId`),
    INDEX `calendar_events_parentEventId_idx`(`parentEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_attendees` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE') NOT NULL DEFAULT 'PENDING',
    `isOrganizer` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_attendees_eventId_idx`(`eventId`),
    INDEX `event_attendees_userId_idx`(`userId`),
    INDEX `event_attendees_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_reminders` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `reminderTime` DATETIME(3) NOT NULL,
    `reminderType` ENUM('NOTIFICATION', 'EMAIL', 'SMS', 'WHATSAPP') NOT NULL DEFAULT 'NOTIFICATION',
    `message` VARCHAR(191) NULL,
    `isSent` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_reminders_eventId_idx`(`eventId`),
    INDEX `event_reminders_reminderTime_idx`(`reminderTime`),
    INDEX `event_reminders_isSent_idx`(`isSent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `tasks_projectId_idx` ON `tasks`(`projectId`);

-- CreateIndex
CREATE INDEX `tasks_contactId_idx` ON `tasks`(`contactId`);

-- CreateIndex
CREATE INDEX `tasks_milestoneId_idx` ON `tasks`(`milestoneId`);

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `project_milestones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_parentEventId_fkey` FOREIGN KEY (`parentEventId`) REFERENCES `calendar_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `project_milestones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_attendees` ADD CONSTRAINT `event_attendees_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `calendar_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_attendees` ADD CONSTRAINT `event_attendees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_reminders` ADD CONSTRAINT `event_reminders_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `calendar_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
