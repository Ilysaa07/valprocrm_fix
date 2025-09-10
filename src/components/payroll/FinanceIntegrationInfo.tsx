'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  DollarSign, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react'

interface FinanceTransaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  description: string
  date: string
  createdAt: string
  createdBy: {
    id: string
    fullName: string
    email: string
  }
}

interface FinanceIntegrationInfoProps {
  payrollId: string
  payrollAmount: number
  employeeName: string
  period: string
}

export default function FinanceIntegrationInfo({ 
  payrollId, 
  payrollAmount, 
  employeeName, 
  period 
}: FinanceIntegrationInfoProps) {
  const [transaction, setTransaction] = useState<FinanceTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTransaction = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch(`/api/admin/payroll/${payrollId}/finance`)
      
      if (res.ok) {
        const data = await res.json()
        setTransaction(data.data)
      } else if (res.status === 404) {
        setTransaction(null)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Gagal memuat data transaksi keuangan')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data transaksi keuangan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransaction()
  }, [payrollId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Memuat informasi integrasi keuangan...
          </span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
              Error Integrasi Keuangan
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadTransaction}
              className="text-red-800 border-red-300 hover:bg-red-100 dark:text-red-200 dark:border-red-600 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Belum Ada Transaksi Keuangan
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Transaksi keuangan untuk slip gaji ini belum tercatat. 
              Ini mungkin terjadi jika slip gaji dibuat sebelum fitur integrasi diaktifkan.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            Integrasi Keuangan Aktif
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-300">ID Transaksi:</span>
              <span className="font-mono text-green-800 dark:text-green-200">
                {transaction.id.slice(-8)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-300">Kategori:</span>
              <span className="text-green-800 dark:text-green-200">
                {transaction.category === 'PAYROLL_EXPENSE' ? 'Pembayaran Gaji' : transaction.category}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-300">Jumlah:</span>
              <span className="font-semibold text-green-800 dark:text-green-200">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-300">Tanggal Transaksi:</span>
              <span className="text-green-800 dark:text-green-200">
                {formatDate(transaction.date)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-300">Dibuat Oleh:</span>
              <span className="text-green-800 dark:text-green-200">
                {transaction.createdBy.fullName}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
            <p className="text-xs text-green-600 dark:text-green-400">
              <strong>Deskripsi:</strong> {transaction.description}
            </p>
          </div>
          
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('/admin/finance', '_blank')}
              className="text-green-800 border-green-300 hover:bg-green-100 dark:text-green-200 dark:border-green-600 dark:hover:bg-green-900/30"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Lihat di Manajemen Keuangan
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}


