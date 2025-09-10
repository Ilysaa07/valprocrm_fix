'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  Users, 
  FileText, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Banknote,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import PayrollModal from '@/components/payroll/PayrollModal'
import EmployeeBankWarning from '@/components/payroll/EmployeeBankWarning'
import NoEligibleEmployeesWarning from '@/components/payroll/NoEligibleEmployeesWarning'

interface PayrollComponent {
  id?: string
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
  }
  components: PayrollComponent[]
}

interface Employee {
  id: string
  fullName: string
  email: string
  bankAccountNumber?: string
  ewalletNumber?: string
  phoneNumber?: string
}

export default function AdminPayrollPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'templates'>('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadPayrolls = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (selectedPeriod) params.append('period', selectedPeriod)
      if (selectedEmployee) params.append('employeeId', selectedEmployee)
      if (selectedStatus) params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/admin/payroll?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        setPayrolls(data.data)
        setTotalPages(data.pagination.pages)
      } else {
        showToast(data.error || 'Gagal memuat data payroll', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat memuat data payroll', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedPeriod, selectedEmployee, selectedStatus, searchTerm, showToast])

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try {
      const res = await fetch('/api/admin/payroll/eligible-employees')
      const data = await res.json()
      
      if (res.ok) {
        setEmployees(data.data || [])
      }
    } catch {
      // Handle error silently
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    
    loadPayrolls()
    loadEmployees()
  }, [session, status, loadPayrolls, loadEmployees])

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

  const exportPayrolls = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({ format })
      if (selectedPeriod) params.append('period', selectedPeriod)
      if (selectedEmployee) params.append('employeeId', selectedEmployee)
      if (selectedStatus) params.append('status', selectedStatus)

      const res = await fetch(`/api/admin/payroll/export?${params}`)
      
      if (res.ok) {
        if (format === 'excel') {
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `payrolls_${selectedPeriod || 'all'}.csv`
          a.click()
          window.URL.revokeObjectURL(url)
        }
        showToast(`Export ${format.toUpperCase()} berhasil`, { title: 'Sukses', type: 'success' })
      } else {
        showToast('Gagal export data', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat export', { title: 'Error', type: 'error' })
    }
  }

  const deletePayroll = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus slip gaji ini?')) return
    
    try {
      const res = await fetch(`/api/admin/payroll/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        const responseData = await res.json()
        
        // Notifikasi utama
        showToast('Slip gaji berhasil dihapus', { title: 'Sukses', type: 'success' })
        
        // Notifikasi integrasi keuangan
        if (responseData.financeIntegration) {
          if (responseData.financeIntegration.success) {
            showToast(
              'Transaksi keuangan terkait juga berhasil dihapus', 
              { title: 'Integrasi Keuangan', type: 'success' }
            )
          } else {
            showToast(
              `Integrasi keuangan gagal: ${responseData.financeIntegration.error}`, 
              { title: 'Peringatan', type: 'warning' }
            )
          }
        }
        
        await loadPayrolls()
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal menghapus slip gaji', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat menghapus slip gaji', { title: 'Error', type: 'error' })
    }
  }

  const updatePayrollStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        showToast('Status slip gaji berhasil diupdate', { title: 'Sukses', type: 'success' })
        await loadPayrolls()
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal update status', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat update status', { title: 'Error', type: 'error' })
    }
  }

  const handleSavePayroll = async (payrollData: any) => {
    try {
      const url = editingPayroll ? `/api/admin/payroll/${editingPayroll.id}` : '/api/admin/payroll'
      const method = editingPayroll ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payrollData)
      })
      
      if (res.ok) {
        const responseData = await res.json()
        
        // Notifikasi utama
        showToast(
          editingPayroll ? 'Slip gaji berhasil diupdate' : 'Slip gaji berhasil dibuat', 
          { title: 'Sukses', type: 'success' }
        )
        
        // Notifikasi integrasi keuangan
        if (responseData.financeIntegration) {
          if (responseData.financeIntegration.success) {
            showToast(
              'Transaksi keuangan berhasil dicatat secara otomatis', 
              { title: 'Integrasi Keuangan', type: 'success' }
            )
          } else {
            showToast(
              `Integrasi keuangan gagal: ${responseData.financeIntegration.error}`, 
              { title: 'Peringatan', type: 'warning' }
            )
          }
        }
        
        await loadPayrolls()
        setShowCreateModal(false)
        setEditingPayroll(null)
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal menyimpan slip gaji', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan slip gaji', { title: 'Error', type: 'error' })
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#121212] min-h-screen transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              Manajemen Slip Gaji
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola slip gaji karyawan</p>
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
            <Button 
              onClick={() => setShowCreateModal(true)}
              disabled={employees.length === 0 || loadingEmployees}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Buat Slip Gaji
              {employees.length === 0 && !loadingEmployees && (
                <span className="text-xs ml-1">(Tidak ada karyawan eligible)</span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Karyawan
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
              >
                <option value="">Semua Karyawan</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
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
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Export Actions */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportPayrolls('excel')}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => exportPayrolls('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* No Eligible Employees Warning */}
        {employees.length === 0 && !loadingEmployees && (
          <NoEligibleEmployeesWarning
            onManageEmployees={() => window.open('/admin/users', '_blank')}
          />
        )}

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
              <p className="text-sm text-gray-400 dark:text-gray-500">Buat slip gaji pertama untuk karyawan</p>
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
                          {payroll.employee.fullName}
                        </h4>
                        <Badge className={`text-xs ${getStatusColor(payroll.status)}`}>
                          {payroll.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{payroll.period}</span>
                        <span>•</span>
                        <span>Gaji Pokok: {formatCurrency(payroll.basicSalary)}</span>
                        <span>•</span>
                        <span>Gaji Bersih: {formatCurrency(payroll.netSalary)}</span>
                        {payroll.employee.bankAccountNumber && (
                          <>
                            <span>•</span>
                            <span>Rek: {payroll.employee.bankAccountNumber}</span>
                          </>
                        )}
                        {payroll.employee.ewalletNumber && (
                          <>
                            <span>•</span>
                            <span>E-wallet: {payroll.employee.ewalletNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPayroll(payroll)
                        setShowCreateModal(true)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Lihat
                    </Button>
                    {payroll.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updatePayrollStatus(payroll.id, 'APPROVED')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Setujui
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deletePayroll(payroll.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus
                        </Button>
                      </>
                    )}
                    {payroll.status === 'APPROVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePayrollStatus(payroll.id, 'PAID')}
                        className="flex items-center gap-1"
                      >
                        <Banknote className="w-3 h-3" />
                        Tandai Dibayar
                      </Button>
                    )}
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

        {/* Payroll Modal */}
        <PayrollModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingPayroll(null)
          }}
          onSave={handleSavePayroll}
          employees={employees}
          editingPayroll={editingPayroll}
          loadingEmployees={loadingEmployees}
        />
      </div>
    </AdminLayout>
  )
}
