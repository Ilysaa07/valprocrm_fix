'use client'

import { AlertTriangle, CreditCard, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface EmployeeBankWarningProps {
  employee: {
    id: string
    fullName: string
    email: string
    bankAccountNumber?: string
    ewalletNumber?: string
    phoneNumber?: string
  }
  onEditProfile?: () => void
}

export default function EmployeeBankWarning({ employee, onEditProfile }: EmployeeBankWarningProps) {
  const hasBankAccount = !!employee.bankAccountNumber
  const hasEwallet = !!employee.ewalletNumber
  const hasPaymentMethod = hasBankAccount || hasEwallet

  if (hasPaymentMethod) {
    return null
  }

  return (
    <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Informasi Rekening/E-wallet Belum Lengkap
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Karyawan <strong>{employee.fullName}</strong> belum memiliki nomor rekening bank atau e-wallet. 
            Slip gaji tidak dapat dibuat tanpa informasi rekening atau e-wallet.
          </p>
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <User className="w-4 h-4" />
            <span>{employee.email}</span>
            {employee.phoneNumber && (
              <>
                <span>•</span>
                <span>{employee.phoneNumber}</span>
              </>
            )}
          </div>
          {onEditProfile && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onEditProfile}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-900/30"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Lengkapi Profil
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
