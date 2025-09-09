/*
  Warnings:

  - The values [AUDIO] on the enum `messages_messageType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `feedback` on the `task_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `task_submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `messages` MODIFY `messageType` ENUM('TEXT', 'FILE', 'IMAGE', 'VIDEO', 'DELETED') NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `task_submissions` DROP COLUMN `feedback`,
    DROP COLUMN `status`;
