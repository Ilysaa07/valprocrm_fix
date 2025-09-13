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
  summary: {
    totalIncome: number
    totalExpense: number
    netIncome: number
    period: string
  }
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

  return (
    <div className="space-y-6">
      {/* Trading-Style Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/95 dark:bg-[#1e293b] rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Pemasukan</p>
              <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                {formatCurrencyShort(data.summary.totalIncome)}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mr-2"></div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Positif</span>
              </div>
            </div>
            <div className="p-3 bg-secondary-500/20 rounded-xl border border-secondary-500/30">
              <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-[#1e293b] rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                {formatCurrencyShort(data.summary.totalExpense)}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-danger-500 rounded-full mr-2"></div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Negatif</span>
              </div>
            </div>
            <div className="p-3 bg-danger-500/20 rounded-xl border border-danger-500/30">
              <svg className="w-6 h-6 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-white/95 dark:bg-[#1e293b] rounded-xl border p-6 shadow-xl backdrop-blur-sm ${
          data.summary.netIncome >= 0 
            ? 'border-secondary-500/30' 
            : 'border-danger-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Laba Bersih</p>
              <p className={`text-2xl font-bold ${
                data.summary.netIncome >= 0 
                  ? 'text-secondary-600 dark:text-secondary-400' 
                  : 'text-danger-600 dark:text-danger-400'
              }`}>
                {formatCurrencyShort(data.summary.netIncome)}
              </p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  data.summary.netIncome >= 0 ? 'bg-secondary-500' : 'bg-danger-500'
                }`}></div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {data.summary.netIncome >= 0 ? 'Untung' : 'Rugi'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${
              data.summary.netIncome >= 0 
                ? 'bg-secondary-500/20 border-secondary-500/30' 
                : 'bg-danger-500/20 border-danger-500/30'
            }`}>
              <svg className={`w-6 h-6 ${
                data.summary.netIncome >= 0 ? 'text-secondary-500' : 'text-danger-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Trading-Style Chart Controls */}
      <div className="bg-white/95 dark:bg-[#1e293b] rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Dashboard Keuangan</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 border-gray-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
            >
              <option value="6months">6M</option>
              <option value="1year">1Y</option>
              <option value="all">ALL</option>
            </select>
            
            <div className="flex rounded-lg p-1 border bg-gray-100 border-gray-300 dark:bg-slate-800 dark:border-slate-600">
              <button
                onClick={() => setActiveChart('trend')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === 'trend' 
                    ? 'bg-emerald-500 text-slate-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setActiveChart('income')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === 'income' 
                    ? 'bg-emerald-500 text-slate-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setActiveChart('expense')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === 'expense' 
                    ? 'bg-emerald-500 text-slate-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Expense
              </button>
            </div>
          </div>
        </div>

        {/* Trading-Style Charts */}
        <div className="h-80 rounded-lg border p-4 bg-white border-gray-200 dark:bg-[#1e293b] dark:border-slate-700/50">
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
          )}

          {activeChart === 'expense' && (
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
          )}
        </div>
      </div>
    </div>
  )
}

