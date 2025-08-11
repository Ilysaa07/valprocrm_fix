'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

interface ChartData {
  month: string
  income: number
  expense: number
}

interface CategoryData {
  category: string
  amount: number
  name: string
}

interface TransactionChartData {
  chartData: ChartData[]
  incomeCategories: CategoryData[]
  expenseCategories: CategoryData[]
  summary: {
    totalIncome: number
    totalExpense: number
    netIncome: number
    period: string
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export default function TransactionChart() {
  const [data, setData] = useState<TransactionChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6months')
  const [activeChart, setActiveChart] = useState<'trend' | 'income' | 'expense'>('trend')

  useEffect(() => {
    fetchChartData()
  }, [period])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transactions/chart?period=${period}`)
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData)
      } else {
        console.error('Failed to fetch chart data')
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}M`
    } else if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}rb`
    }
    return formatCurrency(value)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500 text-center">Gagal memuat data chart</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrencyShort(data.summary.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrencyShort(data.summary.totalExpense)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Keuntungan Bersih</p>
              <p className={`text-2xl font-bold ${data.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyShort(data.summary.netIncome)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${data.summary.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${data.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Analisis Keuangan</h3>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="6months">6 Bulan Terakhir</option>
              <option value="1year">1 Tahun Terakhir</option>
              <option value="all">Semua Data</option>
            </select>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveChart('trend')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeChart === 'trend' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tren
              </button>
              <button
                onClick={() => setActiveChart('income')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeChart === 'income' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setActiveChart('expense')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeChart === 'expense' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="h-80">
          {activeChart === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrencyShort} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Pemasukan"
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Pengeluaran"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'income' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.incomeCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.incomeCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Jumlah']} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'expense' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expenseCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={formatCurrencyShort} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Jumlah']} />
                <Bar dataKey="amount" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

