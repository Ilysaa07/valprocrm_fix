-- Add indexes for payroll validation optimization
-- These indexes will improve performance when filtering employees with bank accounts or e-wallets

-- Index for filtering employees by role and status
CREATE INDEX `users_role_status_idx` ON `users` (`role`, `status`);

-- Index for filtering employees with bank account or e-wallet
CREATE INDEX `users_payment_methods_idx` ON `users` (`bankAccountNumber`, `ewalletNumber`);

-- Composite index for payroll employee filtering
CREATE INDEX `users_payroll_eligible_idx` ON `users` (`role`, `status`, `bankAccountNumber`, `ewalletNumber`);
