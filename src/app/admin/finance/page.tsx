'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Transaction {
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

interface Summary {
  totalIncome: number
  totalExpense: number
  netIncome: number
}

export default function AdminFinancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editFormData, setEditFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const incomeCategories = [
    { value: 'SALARY', label: 'Gaji' },
    { value: 'BONUS', label: 'Bonus' },
    { value: 'COMMISSION', label: 'Komisi' },
    { value: 'OTHER_INCOME', label: 'Pemasukan Lainnya' }
  ]

  const expenseCategories = [
    { value: 'OFFICE_SUPPLIES', label: 'Perlengkapan Kantor' },
    { value: 'UTILITIES', label: 'Utilitas' },
    { value: 'RENT', label: 'Sewa' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'TRAVEL', label: 'Perjalanan' },
    { value: 'MEALS', label: 'Makan' },
    { value: 'EQUIPMENT', label: 'Peralatan' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'TRAINING', label: 'Pelatihan' },
    { value: 'OTHER_EXPENSE', label: 'Pengeluaran Lainnya' }
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/employee')
      return
    }

    if (status === 'authenticated') {
      fetchTransactions()
    }
  }, [status, session, router])

  const fetchTransactions = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.type) queryParams.append('type', filters.type)
      if (filters.category) queryParams.append('category', filters.category)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await fetch(`/api/transactions?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString()
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          type: 'INCOME',
          category: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        fetchTransactions()
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal membuat transaksi')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Terjadi kesalahan saat membuat transaksi')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTransactions()
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal menghapus transaksi')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Terjadi kesalahan saat menghapus transaksi')
    }
  }

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingTransaction) return

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          amount: parseFloat(editFormData.amount),
          date: new Date(editFormData.date).toISOString()
        }),
      })

      if (response.ok) {
        setEditingTransaction(null)
        fetchTransactions()
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal mengupdate transaksi')
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('Terjadi kesalahan saat mengupdate transaksi')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const getCategoryLabel = (category: string) => {
    const allCategories = [...incomeCategories, ...expenseCategories]
    return allCategories.find(cat => cat.value === category)?.label || category
  }

  if (status === 'loading' || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Keuangan</h1>
            <p className="text-gray-600">Kelola pemasukan dan pengeluaran perusahaan</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpense)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo Bersih</p>
                <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netIncome)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Tipe</option>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Kategori</option>
                <optgroup label="Pemasukan">
                  {incomeCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Pengeluaran">
                  {expenseCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchTransactions}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat Oleh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'INCOME' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.createdBy.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(transaction)
                            setEditFormData({
                              type: transaction.type,
                              category: transaction.category,
                              amount: transaction.amount.toString(),
                              description: transaction.description,
                              date: new Date(transaction.date).toISOString().split('T')[0]
                            })
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada transaksi</p>
            </div>
          )}
        </div>

        {/* Create Transaction Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Tambah Transaksi</h2>
              
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      type: e.target.value as 'INCOME' | 'EXPENSE',
                      category: '' // Reset category when type changes
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="INCOME">Pemasukan</option>
                    <option value="EXPENSE">Pengeluaran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {(formData.type === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Transaksi</h2>
              
              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ 
                      ...editFormData, 
                      type: e.target.value as 'INCOME' | 'EXPENSE',
                      category: '' // Reset category when type changes
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="INCOME">Pemasukan</option>
                    <option value="EXPENSE">Pengeluaran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {(editFormData.type === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

