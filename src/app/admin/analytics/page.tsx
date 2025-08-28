"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import dynamic from 'next/dynamic'
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Activity,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  PieChart
} from 'lucide-react'

const TransactionChart = dynamic(() => import('@/components/TransactionChart'), { ssr: false })

interface EmployeeData {
  status: 'PRESENT' | 'ABSENT' | 'WFH' | 'LEAVE'
  userId: string
  user: {
    id: string
    fullName: string
    email: string
    profilePicture: string | null
  }
}



interface AnalyticsData {
  totalEmployees: number
  activeEmployees: number
  totalAttendance: number
  presentToday: number
  absentToday: number
  wfhToday: number
  leaveToday: number
  pendingRequests: number
  monthlyTrend: {
    month: string
    present: number
    absent: number
    wfh: number
    leave: number
  }[]
}

type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }

export default function AdminAnalytics() {
  // const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', [])
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<MinimalSocket | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
    pollingRef.current = setInterval(fetchAnalyticsData, 30000)
    ;(async () => {
      try {
        const mod = (await import('socket.io-client')) as unknown as { io?: (url: string, opts: Record<string, unknown>) => MinimalSocket; default?: (url: string, opts: Record<string, unknown>) => MinimalSocket }
        const factory: (url: string, opts: Record<string, unknown>) => MinimalSocket = (mod.io || mod.default) as (url: string, opts: Record<string, unknown>) => MinimalSocket
        const s = factory(appUrl, { path: '/socket.io' })
        socketRef.current = s
        const refresh = () => fetchAnalyticsData()
        s.on('attendance_updated', refresh)
        s.on('leave_status_changed', refresh)
      } catch {}
    })()
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [appUrl])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch attendance data for analytics
      const [attendanceRes, requestsRes, monthlyTrendsRes] = await Promise.all([
        fetch('/api/admin/attendance'),
        fetch('/api/admin/attendance/requests'),
        fetch('/api/admin/analytics/monthly-trends')
      ])

      if (attendanceRes.ok && requestsRes.ok && monthlyTrendsRes.ok) {
        const [attendanceJson, requestsJson, monthlyTrendsJson] = await Promise.all([
          attendanceRes.json(),
          requestsRes.json(),
          monthlyTrendsRes.json()
        ])
        const attendanceData = attendanceJson?.data || attendanceJson
        const requestsData = requestsJson?.data || requestsJson
        const monthlyTrendsData = monthlyTrendsJson?.data || []

        // Calculate analytics from the data
        const totalEmployees = attendanceData.totalEmployees || 0
        const presentToday = attendanceData.employees?.filter((e: EmployeeData) => e.status === 'PRESENT').length || 0
        const absentToday = attendanceData.employees?.filter((e: EmployeeData) => e.status === 'ABSENT').length || 0
        const wfhToday = attendanceData.employees?.filter((e: EmployeeData) => e.status === 'WFH').length || 0
        const leaveToday = attendanceData.employees?.filter((e: EmployeeData) => e.status === 'LEAVE').length || 0
        const pendingRequests = (requestsData.leaveRequests?.length || 0) + (requestsData.wfhLogs?.length || 0)

        setAnalytics({
          totalEmployees,
          activeEmployees: presentToday + wfhToday,
          totalAttendance: totalEmployees,
          presentToday,
          absentToday,
          wfhToday,
          leaveToday,
          pendingRequests,
          monthlyTrend: monthlyTrendsData
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Tidak ada data analytics</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Coba refresh halaman atau hubungi administrator.</p>
        </div>
      </AdminLayout>
    )
  }

    const safePercent = (numerator: number, denominator: number) => {
    if (!denominator || denominator === 0) return '0.0'
    const value = (numerator / denominator) * 100
    if (Number.isNaN(value) || !Number.isFinite(value)) return '0.0'
    return value.toFixed(1)
  }
  const attendanceRate = safePercent(analytics.presentToday + analytics.wfhToday, analytics.totalEmployees)
  // const pendingRate = safePercent(analytics.pendingRequests, analytics.totalEmployees)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-10 bg-gradient-to-b from-blue-500 via-green-500 to-amber-500 rounded-full shadow-lg"></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-green-600 to-amber-600 dark:from-blue-400 dark:via-green-400 dark:to-amber-400 bg-clip-text text-transparent">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Ringkasan performa sistem dan karyawan</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 px-4 py-3 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Employees */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Karyawan</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalEmployees}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tingkat Kehadiran</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Permintaan Pending</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.pendingRequests}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Active Employees */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Karyawan Aktif</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.activeEmployees}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Overview */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan Hari Ini</h3>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Hadir</span>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">{analytics.presentToday}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Tidak Hadir</span>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">{analytics.absentToday}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">WFH</span>
                </div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{analytics.wfhToday}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Izin</span>
                </div>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{analytics.leaveToday}</span>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trend Bulanan</h3>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div className="space-y-3">
              {analytics.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{month.present}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{month.absent}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{month.wfh}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Analysis */}
        <div className="bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analisis Keuangan</h3>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <TransactionChart />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Aksi Cepat</h3>
            <PieChart className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/admin/attendance" 
              className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/20 dark:hover:to-blue-800/30 rounded-2xl transition-all duration-300 group border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg hover:scale-[1.02]"
            >
              <Calendar className="w-6 h-6 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Dashboard Absensi</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kelola kehadiran karyawan</p>
              </div>
            </a>
            
            <a 
              href="/admin/attendance/requests" 
              className="flex items-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-800/20 hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900/20 dark:hover:to-amber-800/30 rounded-2xl transition-all duration-300 group border border-amber-200/50 dark:border-amber-700/50 hover:shadow-lg hover:scale-[1.02]"
            >
              <AlertCircle className="w-6 h-6 text-amber-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Validasi Permintaan</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Izin dan WFH pending</p>
              </div>
            </a>
            
            <a 
              href="/admin/users" 
              className="flex items-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/10 dark:to-emerald-800/20 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/30 rounded-2xl transition-all duration-300 group border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg hover:scale-[1.02]"
            >
              <Users className="w-6 h-6 text-emerald-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Kelola Karyawan</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tambah/edit data karyawan</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
