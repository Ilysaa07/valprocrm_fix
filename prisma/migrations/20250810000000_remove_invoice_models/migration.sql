-- DropForeignKey
ALTER TABLE `invoice_items` DROP FOREIGN KEY `invoice_items_invoiceId_fkey`;

-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_recipientId_fkey`;

-- DropTable
DROP TABLE `invoice_items`;

-- DropTable
DROP TABLE `invoices`;

-- Enum tidak perlu dihapus secara eksplisit dalam MySQL/MariaDB
-- karena enum diimplementasikan sebagai constraint pada kolom, bukan sebagai tipe data terpisah