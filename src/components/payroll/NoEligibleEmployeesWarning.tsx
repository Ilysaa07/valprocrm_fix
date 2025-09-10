'use client'

import { AlertTriangle, Users, CreditCard, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface NoEligibleEmployeesWarningProps {
  onManageEmployees?: () => void
}

export default function NoEligibleEmployeesWarning({ onManageEmployees }: NoEligibleEmployeesWarningProps) {
  return (
    <Card className="p-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Tidak Ada Karyawan yang Memenuhi Syarat
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            Saat ini tidak ada karyawan yang memiliki nomor rekening bank atau e-wallet. 
            Untuk membuat slip gaji, karyawan harus memiliki minimal salah satu dari:
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <CreditCard className="w-4 h-4" />
              <span>Nomor rekening bank</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <Users className="w-4 h-4" />
              <span>Nomor e-wallet</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {onManageEmployees && (
              <Button
                onClick={onManageEmployees}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <UserPlus className="w-4 h-4" />
                Kelola Data Karyawan
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.open('/admin/users', '_blank')}
              className="flex items-center gap-2 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-900/30"
            >
              <Users className="w-4 h-4" />
              Lihat Semua Karyawan
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
