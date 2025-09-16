-- CreateTable
CREATE TABLE `invoice_subitems` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceItemId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(15, 2) NOT NULL,
    `total` DECIMAL(15, 2) NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `invoice_subitems_invoiceItemId_idx`(`invoiceItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invoice_subitems` ADD CONSTRAINT `invoice_subitems_invoiceItemId_fkey` FOREIGN KEY (`invoiceItemId`) REFERENCES `invoice_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
