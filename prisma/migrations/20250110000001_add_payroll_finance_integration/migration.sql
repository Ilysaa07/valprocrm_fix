-- Add payroll reference to transactions table for finance integration
-- This allows tracking which transactions are related to payroll payments

-- Add payrollId field to transactions table
ALTER TABLE `transactions` ADD COLUMN `payrollId` VARCHAR(191) NULL;

-- Add index for payroll reference
CREATE INDEX `transactions_payrollId_idx` ON `transactions` (`payrollId`);

-- Add foreign key constraint (optional, can be added later if needed)
-- ALTER TABLE `transactions` ADD CONSTRAINT `transactions_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


