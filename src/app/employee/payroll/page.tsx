'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  FileText, 
  Download, 
  Search,
  Calendar,
  DollarSign,
  Banknote,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard as CardIcon
} from 'lucide-react'
import PayrollPDFGenerator from '@/components/payroll/PayrollPDFGenerator'

interface PayrollComponent {
  id: string
  name: string
  type: string
  amount: number
  isTaxable: boolean
  description?: string
}

interface Payroll {
  id: string
  employeeId: string
  period: string
  basicSalary: number
  totalAllowances: number
  totalDeductions: number
  grossSalary: number
  netSalary: number
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED'
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    fullName: string
    email: string
    bankAccountNumber?: string
    ewalletNumber?: string
    phoneNumber?: string
    address?: string
    nikKtp?: string
  }
  components: PayrollComponent[]
}

export default function EmployeePayrollPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [showPayrollModal, setShowPayrollModal] = useState(false)

  const loadPayrolls = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (selectedPeriod) params.append('period', selectedPeriod)
      if (selectedStatus) params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/employee/payroll?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        setPayrolls(data.data)
        setTotalPages(data.pagination.pages)
      } else {
        showToast(data.error || 'Gagal memuat data slip gaji', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat memuat data slip gaji', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedPeriod, selectedStatus, searchTerm, showToast])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'EMPLOYEE') redirect('/admin')
    
    loadPayrolls()
  }, [session, status, loadPayrolls])

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
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'PAID': return <Banknote className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Draft'
      case 'APPROVED': return 'Disetujui'
      case 'PAID': return 'Dibayar'
      case 'CANCELLED': return 'Dibatalkan'
      default: return status
    }
  }

  const viewPayroll = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setShowPayrollModal(true)
  }

  const downloadPayroll = async (payroll: Payroll) => {
    try {
      // The PDF generation is handled by PayrollPDFGenerator component
      showToast('PDF sedang diproses...', { title: 'Info', type: 'info' })
    } catch {
      showToast('Gagal mengunduh slip gaji', { title: 'Error', type: 'error' })
    }
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#121212] min-h-screen transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Slip Gaji Saya
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Lihat dan unduh slip gaji Anda</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadPayrolls} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Periode
              </label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Disetujui</option>
                <option value="PAID">Dibayar</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan periode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payroll List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Slip Gaji</h3>
            <Badge variant="secondary">
              {payrolls.length} slip gaji
            </Badge>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Tidak ada slip gaji ditemukan</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Slip gaji akan muncul setelah dibuat oleh admin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payrolls.map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                      {getStatusIcon(payroll.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Slip Gaji {payroll.period}
                        </h4>
                        <Badge className={`text-xs ${getStatusColor(payroll.status)}`}>
                          {getStatusText(payroll.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Gaji Pokok: {formatCurrency(payroll.basicSalary)}</span>
                        <span>•</span>
                        <span>Gaji Bersih: {formatCurrency(payroll.netSalary)}</span>
                        <span>•</span>
                        <span>Dibuat: {formatDate(payroll.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewPayroll(payroll)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Lihat Detail
                    </Button>
                    <PayrollPDFGenerator payroll={payroll} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Payroll Detail Modal */}
        {showPayrollModal && selectedPayroll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Slip Gaji {selectedPayroll.period}
                  </h3>
                  <div className="flex gap-2">
                    <PayrollPDFGenerator payroll={selectedPayroll} />
                    <Button
                      variant="outline"
                      onClick={() => setShowPayrollModal(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>

                {/* Employee Info */}
                <Card className="p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informasi Karyawan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nama Lengkap</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedPayroll.employee.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedPayroll.employee.email}
                      </p>
                    </div>
                    {selectedPayroll.employee.phoneNumber && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">No. Telepon</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {selectedPayroll.employee.phoneNumber}
                        </p>
                      </div>
                    )}
                    {selectedPayroll.employee.bankAccountNumber && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">No. Rekening Bank</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <CardIcon className="w-4 h-4" />
                          {selectedPayroll.employee.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    {selectedPayroll.employee.ewalletNumber && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">No. E-wallet</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {selectedPayroll.employee.ewalletNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Payroll Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Ringkasan Gaji
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Gaji Pokok</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(selectedPayroll.basicSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Tunjangan</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          +{formatCurrency(selectedPayroll.totalAllowances)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Potongan</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          -{formatCurrency(selectedPayroll.totalDeductions)}
                        </span>
                      </div>
                      <hr className="border-gray-200 dark:border-gray-700" />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900 dark:text-white">Gaji Bersih</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(selectedPayroll.netSalary)}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Informasi Slip
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Periode</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedPayroll.period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <Badge className={`text-xs ${getStatusColor(selectedPayroll.status)}`}>
                          {getStatusText(selectedPayroll.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Dibuat</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedPayroll.createdAt)}
                        </span>
                      </div>
                      {selectedPayroll.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Dibayar</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatDate(selectedPayroll.paidAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Payroll Components */}
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Detail Komponen Gaji
                  </h4>
                  <div className="space-y-2">
                    {selectedPayroll.components.map((component, index) => (
                      <div key={component.id || index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{component.name}</p>
                          {component.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{component.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            component.type.includes('ALLOWANCE') || component.type === 'BASIC_SALARY' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {component.type.includes('ALLOWANCE') || component.type === 'BASIC_SALARY' ? '+' : '-'}
                            {formatCurrency(component.amount)}
                          </p>
                          {!component.isTaxable && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Non-pajak</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Notes */}
                {selectedPayroll.notes && (
                  <Card className="p-4 mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Catatan
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedPayroll.notes}</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}
