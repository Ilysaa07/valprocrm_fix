'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  AlertTriangle,
  User,
  Calendar,
  Banknote,
  CreditCard
} from 'lucide-react'
import EmployeeBankWarning from './EmployeeBankWarning'

interface PayrollComponent {
  id?: string
  name: string
  type: string
  amount: number
  isTaxable: boolean
  description?: string
}

interface Employee {
  id: string
  fullName: string
  email: string
  bankAccountNumber?: string
  ewalletNumber?: string
  phoneNumber?: string
}

interface PayrollModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payrollData: any) => void
  employees: Employee[]
  editingPayroll?: any
  loadingEmployees?: boolean
}

const COMPONENT_TYPES = [
  { value: 'BASIC_SALARY', label: 'Gaji Pokok', category: 'allowance' },
  { value: 'TRANSPORT_ALLOWANCE', label: 'Tunjangan Transport', category: 'allowance' },
  { value: 'MEAL_ALLOWANCE', label: 'Tunjangan Makan', category: 'allowance' },
  { value: 'HOUSING_ALLOWANCE', label: 'Tunjangan Perumahan', category: 'allowance' },
  { value: 'MEDICAL_ALLOWANCE', label: 'Tunjangan Kesehatan', category: 'allowance' },
  { value: 'BONUS', label: 'Bonus', category: 'allowance' },
  { value: 'OVERTIME', label: 'Lembur', category: 'allowance' },
  { value: 'COMMISSION', label: 'Komisi', category: 'allowance' },
  { value: 'OTHER_ALLOWANCE', label: 'Tunjangan Lainnya', category: 'allowance' },
  { value: 'INCOME_TAX', label: 'Pajak Penghasilan', category: 'deduction' },
  { value: 'SOCIAL_SECURITY', label: 'BPJS Ketenagakerjaan', category: 'deduction' },
  { value: 'HEALTH_INSURANCE', label: 'BPJS Kesehatan', category: 'deduction' },
  { value: 'PENSION_FUND', label: 'Dana Pensiun', category: 'deduction' },
  { value: 'LOAN_DEDUCTION', label: 'Potongan Pinjaman', category: 'deduction' },
  { value: 'LATE_PENALTY', label: 'Denda Keterlambatan', category: 'deduction' },
  { value: 'ABSENCE_DEDUCTION', label: 'Potongan Absen', category: 'deduction' },
  { value: 'OTHER_DEDUCTION', label: 'Potongan Lainnya', category: 'deduction' }
]

export default function PayrollModal({ 
  isOpen, 
  onClose, 
  onSave, 
  employees, 
  editingPayroll,
  loadingEmployees = false
}: PayrollModalProps) {
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    employeeId: '',
    period: '',
    basicSalary: 0,
    notes: ''
  })
  
  const [components, setComponents] = useState<PayrollComponent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editingPayroll) {
        setFormData({
          employeeId: editingPayroll.employeeId,
          period: editingPayroll.period,
          basicSalary: editingPayroll.basicSalary,
          notes: editingPayroll.notes || ''
        })
        setComponents(editingPayroll.components || [])
      } else {
        setFormData({
          employeeId: '',
          period: '',
          basicSalary: 0,
          notes: ''
        })
        setComponents([])
      }
    }
  }, [isOpen, editingPayroll])

  const addComponent = () => {
    setComponents([...components, {
      name: '',
      type: 'BASIC_SALARY',
      amount: 0,
      isTaxable: true,
      description: ''
    }])
  }

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const updateComponent = (index: number, field: keyof PayrollComponent, value: any) => {
    const newComponents = [...components]
    newComponents[index] = { ...newComponents[index], [field]: value }
    setComponents(newComponents)
  }

  const getComponentTypeLabel = (type: string) => {
    const componentType = COMPONENT_TYPES.find(ct => ct.value === type)
    return componentType ? componentType.label : type
  }

  const getComponentCategory = (type: string) => {
    const componentType = COMPONENT_TYPES.find(ct => ct.value === type)
    return componentType ? componentType.category : 'allowance'
  }

  const calculateTotals = () => {
    const allowances = components.filter(c => getComponentCategory(c.type) === 'allowance')
    const deductions = components.filter(c => getComponentCategory(c.type) === 'deduction')
    
    const totalAllowances = allowances.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const totalDeductions = deductions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const grossSalary = Number(formData.basicSalary) + totalAllowances
    const netSalary = grossSalary - totalDeductions
    
    return { totalAllowances, totalDeductions, grossSalary, netSalary }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employeeId || !formData.period || !formData.basicSalary) {
      showToast('Harap isi semua field yang diperlukan', { title: 'Error', type: 'error' })
      return
    }

    if (components.length === 0) {
      showToast('Harap tambahkan minimal satu komponen gaji', { title: 'Error', type: 'error' })
      return
    }

    // Check if selected employee has bank account or e-wallet
    const selectedEmployee = employees.find(emp => emp.id === formData.employeeId)
    if (!selectedEmployee?.bankAccountNumber && !selectedEmployee?.ewalletNumber) {
      showToast('Karyawan yang dipilih belum memiliki nomor rekening bank atau e-wallet. Harap lengkapi profil karyawan terlebih dahulu.', { title: 'Error', type: 'error' })
      return
    }

    setLoading(true)
    try {
      await onSave({
        ...formData,
        components: components.map((c, index) => ({
          ...c,
          order: index
        }))
      })
      onClose()
    } catch (error) {
      showToast('Terjadi kesalahan saat menyimpan', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingPayroll ? 'Edit Slip Gaji' : 'Buat Slip Gaji Baru'}
            </h3>
            <Button
              variant="outline"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informasi Dasar
              </h4>
              
              {/* Employee Bank Warning */}
              {formData.employeeId && (
                <EmployeeBankWarning
                  employee={employees.find(emp => emp.id === formData.employeeId)!}
                  onEditProfile={() => {
                    // Navigate to employee profile edit
                    window.open(`/admin/users?edit=${formData.employeeId}`, '_blank')
                  }}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Karyawan *
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                    required
                    disabled={loadingEmployees}
                  >
                    <option value="">
                      {loadingEmployees ? 'Memuat karyawan...' : 'Pilih Karyawan'}
                    </option>
                    {employees.map(employee => {
                      const hasBankAccount = !!employee.bankAccountNumber
                      const hasEwallet = !!employee.ewalletNumber
                      const hasPaymentMethod = hasBankAccount || hasEwallet
                      
                      let paymentInfo = ''
                      if (hasBankAccount && hasEwallet) {
                        paymentInfo = '(Rekening & E-wallet)'
                      } else if (hasBankAccount) {
                        paymentInfo = '(Rekening Bank)'
                      } else if (hasEwallet) {
                        paymentInfo = '(E-wallet)'
                      } else {
                        paymentInfo = '(Belum ada rekening/e-wallet)'
                      }
                      
                      return (
                        <option 
                          key={employee.id} 
                          value={employee.id}
                          disabled={!hasPaymentMethod}
                          className={!hasPaymentMethod ? 'text-gray-400' : ''}
                        >
                          {employee.fullName} - {employee.email} {paymentInfo}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Periode *
                  </label>
                  <input
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gaji Pokok *
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catatan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>
            </Card>

            {/* Components */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Komponen Gaji
                </h4>
                <Button
                  type="button"
                  onClick={addComponent}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Komponen
                </Button>
              </div>

              <div className="space-y-3">
                {components.map((component, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Jenis
                        </label>
                        <select
                          value={component.type}
                          onChange={(e) => updateComponent(index, 'type', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
                        >
                          {COMPONENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nama
                        </label>
                        <input
                          type="text"
                          value={component.name}
                          onChange={(e) => updateComponent(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
                          placeholder="Nama komponen"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          value={component.amount}
                          onChange={(e) => updateComponent(index, 'amount', Number(e.target.value))}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
                          min="0"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={component.isTaxable}
                              onChange={(e) => updateComponent(index, 'isTaxable', e.target.checked)}
                              className="rounded"
                            />
                            Kena Pajak
                          </label>
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeComponent(index)}
                          className="p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={component.description || ''}
                        onChange={(e) => updateComponent(index, 'description', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
                        placeholder="Deskripsi (opsional)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Ringkasan Gaji
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gaji Pokok</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(formData.basicSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Tunjangan</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.totalAllowances)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Potongan</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.totalDeductions)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Gaji Kotor</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.grossSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span className="text-gray-900 dark:text-white">Gaji Bersih</span>
                    <span className="text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.netSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Menyimpan...' : (editingPayroll ? 'Update' : 'Simpan')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
