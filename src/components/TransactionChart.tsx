'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  totalIncome: number
  totalExpense: number
  netIncome: number
  period: string
}

const COLORS = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-error)', 'var(--color-accent)/80', 'var(--color-success)/80', 'var(--color-warning)/80', 'var(--color-error)/80']

export default function TransactionChart() {
  const [data, setData] = useState<TransactionChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6months')
  const [activeChart, setActiveChart] = useState<'trend' | 'income' | 'expense'>('trend')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<{ on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void } | null>(null)

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transactions/chart?period=${period}`)
      if (response.ok) {
        const responseData = await response.json()
        setData(responseData.data)
        
        // Debug logging
        console.log('TransactionChart - Data fetched:', {
          period,
          totalIncome: responseData.data?.totalIncome || 0,
          totalExpense: responseData.data?.totalExpense || 0,
          netIncome: responseData.data?.netIncome || 0,
          chartDataPoints: responseData.data?.chartData?.length || 0,
          expenseCategories: responseData.data?.expenseCategories?.length || 0
        })
      } else {
        console.error('Failed to fetch chart data')
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchChartData()
    // Background polling for resilience
    pollingRef.current = setInterval(fetchChartData, 30000)

    // Refresh when tab gains focus or becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchChartData()
    }
    const handleFocus = () => fetchChartData()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    // Try to attach to socket events if available
    ;(async () => {
      try {
        const mod = (await import('socket.io-client')) as unknown as { io?: (url: string, opts: Record<string, unknown>) => any; default?: (url: string, opts: Record<string, unknown>) => any }
        const factory = (mod.io || mod.default) as (url: string, opts: Record<string, unknown>) => any
        const s = factory(typeof window !== 'undefined' ? window.location.origin : '', { path: '/socket.io' })
        socketRef.current = s
        const refresh = () => fetchChartData()
        s.on('transactions_updated', refresh)
        s.on('transaction_created', refresh)
        s.on('transaction_deleted', refresh)
      } catch {}
    })()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [fetchChartData])

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
      <div className="animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500 dark:text-neutral-400">Gagal memuat data chart</p>
      </div>
    )
  }

  // Add safety checks for financial data
  const totalIncome = data.totalIncome || 0
  const totalExpense = data.totalExpense || 0
  const netIncome = data.netIncome || 0

  return (
    <div className="space-y-6">
      {/* Trading-Style Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Pemasukan</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrencyShort(totalIncome)}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Positif</span>
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-xl border border-green-200 dark:border-green-700">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Pengeluaran</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrencyShort(totalExpense)}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Negatif</span>
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900 rounded-xl border border-red-200 dark:border-red-700">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-xl border p-4 sm:p-6 shadow-xl ${
          netIncome >= 0 
            ? 'border-green-200 dark:border-green-700' 
            : 'border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Laba Bersih</p>
              <p className={`text-xl sm:text-2xl font-bold ${
                netIncome >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrencyShort(netIncome)}
              </p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  netIncome >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {netIncome >= 0 ? 'Untung' : 'Rugi'}
                </span>
              </div>
            </div>
            <div className={`p-2 sm:p-3 rounded-xl border ${
              netIncome >= 0 
                ? 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700' 
                : 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-700'
            }`}>
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${
                netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Trading-Style Chart Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard Keuangan</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            >
              <option value="6months">6M</option>
              <option value="1year">1Y</option>
              <option value="all">ALL</option>
            </select>
            
            <div className="flex rounded-lg p-1 border bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600">
              <button
                onClick={() => setActiveChart('trend')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === 'trend' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setActiveChart('income')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === 'income' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setActiveChart('expense')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === 'expense' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Expense
              </button>
            </div>
          </div>
        </div>

        {/* Trading-Style Charts */}
        <div className="h-64 sm:h-80 rounded-lg border p-4 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          {activeChart === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrencyShort} 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    color: '#F9FAFB',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Income"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Expense"
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'income' && (
            data.incomeCategories && data.incomeCategories.length > 0 ? (
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="#1F2937"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Tidak Ada Data Pemasukan</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada transaksi pemasukan dalam periode ini</p>
                </div>
              </div>
            )
          )}

          {activeChart === 'expense' && (
            data.expenseCategories && data.expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.expenseCategories}>
                  <defs>
                    <linearGradient id="expenseBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatCurrencyShort}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="url(#expenseBarGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Tidak Ada Data Pengeluaran</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada transaksi pengeluaran dalam periode ini</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

