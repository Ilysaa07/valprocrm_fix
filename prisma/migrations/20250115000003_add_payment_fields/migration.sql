-- Add payment fields to invoices table
ALTER TABLE `invoices` ADD COLUMN `amountPaid` DECIMAL(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE `invoices` ADD COLUMN `balanceDue` DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- Update existing invoices to have balanceDue = total - amountPaid
UPDATE `invoices` SET `balanceDue` = `total` - `amountPaid`;
