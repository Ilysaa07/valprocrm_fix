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
  Clock,
  FileText,
  UserCheck,
  UserX,
  Home,
  Briefcase,
  Download,
  Upload,
  Eye,
  Target,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

// Dynamic imports for better performance
const TransactionChart = dynamic(() => import('@/components/TransactionChart'), { ssr: false })

// Enhanced interfaces for comprehensive analytics
interface EnhancedAnalyticsData {
  // User Analytics
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  approvedUsers: number
  rejectedUsers: number
  
  // Attendance Analytics
  totalAttendance: number
  presentToday: number
  absentToday: number
  wfhToday: number
  leaveToday: number
  attendanceRate: number
  
  // Task Analytics
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  overdueTasks: number
  taskCompletionRate: number
  
  // Request Analytics
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  
  // Document Analytics
  totalDocuments: number
  recentUploads: number
  totalDownloads: number
  storageUsed: number
  
  // Financial Analytics
  totalIncome: number
  totalExpense: number
  netIncome: number
  
  // Trends
  monthlyTrend: {
    month: string
    present: number
    absent: number
    wfh: number
    leave: number
  }[]
  
  // Performance Metrics
  systemUptime: number
  responseTime: number
  errorRate: number
}

interface QuickStat {
  title: string
  value: string | number
  change: number
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

interface ChartData {
  name: string
  value: number
  color: string
}

type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<EnhancedAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'tasks' | 'financial' | 'documents'>('overview')

  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', [])
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<MinimalSocket | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
    
    // Enhanced polling with exponential backoff
    let pollInterval = 30000
    const maxInterval = 300000 // 5 minutes max
    
    const poll = () => {
      fetchAnalyticsData()
      pollInterval = Math.min(pollInterval * 1.1, maxInterval)
      pollingRef.current = setTimeout(poll, pollInterval)
    }
    
    pollingRef.current = setTimeout(poll, pollInterval)

    // Refresh on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalyticsData()
        pollInterval = 30000 // Reset to initial interval
      }
    }
    
    const handleFocus = () => {
      fetchAnalyticsData()
      pollInterval = 30000
    }
    
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    // Enhanced socket connection for real-time updates
    ;(async () => {
      try {
        const mod = (await import('socket.io-client')) as unknown as { 
          io?: (url: string, opts: Record<string, unknown>) => MinimalSocket
          default?: (url: string, opts: Record<string, unknown>) => MinimalSocket 
        }
        const factory: (url: string, opts: Record<string, unknown>) => MinimalSocket = 
          (mod.io || mod.default) as (url: string, opts: Record<string, unknown>) => MinimalSocket
        const s = factory(appUrl, { path: '/socket.io' })
        socketRef.current = s
        
        const refresh = () => {
          fetchAnalyticsData()
          pollInterval = 30000 // Reset polling interval on real-time update
        }
        
        s.on('attendance_updated', refresh)
        s.on('leave_status_changed', refresh)
        s.on('employee_created', refresh)
        s.on('employee_deleted', refresh)
        s.on('task_updated', refresh)
        s.on('document_uploaded', refresh)
        s.on('transaction_created', refresh)
      } catch (error) {
        console.warn('Socket connection failed:', error)
      }
    })()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [appUrl, selectedPeriod])

  // Quick stats configuration
  const quickStats: QuickStat[] = useMemo(() => {
    if (!analytics) return []
    
    return [
      {
        title: 'Total Karyawan',
        value: analytics.totalUsers,
        change: 5.2,
        changeType: 'positive',
        icon: Users,
        color: 'blue',
        description: 'Total karyawan terdaftar'
      },
      {
        title: 'Tingkat Kehadiran',
        value: `${analytics.attendanceRate.toFixed(1)}%`,
        change: 2.1,
        changeType: 'positive',
        icon: CheckCircle,
        color: 'green',
        description: 'Karyawan hadir hari ini'
      },
      {
        title: 'Tugas Selesai',
        value: analytics.completedTasks,
        change: 12.5,
        changeType: 'positive',
        icon: Target,
        color: 'purple',
        description: 'Tugas yang telah diselesaikan'
      },
      {
        title: 'Dokumen Baru',
        value: analytics.recentUploads,
        change: 8.3,
        changeType: 'positive',
        icon: Upload,
        color: 'orange',
        description: 'Dokumen diupload minggu ini'
      },
      {
        title: 'Pendapatan Bersih',
        value: `Rp ${(analytics.netIncome / 1000000).toFixed(1)}M`,
        change: analytics.netIncome >= 0 ? 15.7 : -5.2,
        changeType: analytics.netIncome >= 0 ? 'positive' : 'negative',
        icon: DollarSign,
        color: analytics.netIncome >= 0 ? 'green' : 'red',
        description: 'Laba bersih bulan ini'
      },
      {
        title: 'Permintaan Pending',
        value: analytics.pendingRequests,
        change: -3.2,
        changeType: 'positive',
        icon: AlertCircle,
        color: 'amber',
        description: 'Menunggu persetujuan'
      }
    ]
  }, [analytics])

  // Chart data for attendance distribution
  const attendanceChartData: ChartData[] = useMemo(() => {
    if (!analytics) return []
    
    return [
      { name: 'Hadir', value: analytics.presentToday, color: '#10B981' },
      { name: 'WFH', value: analytics.wfhToday, color: '#3B82F6' },
      { name: 'Tidak Hadir', value: analytics.absentToday, color: '#EF4444' },
      { name: 'Izin', value: analytics.leaveToday, color: '#F59E0B' }
    ]
  }, [analytics])


  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Enhanced data fetching with comprehensive analytics
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all analytics data in parallel
      const [
        dashboardStatsRes,
        monthlyTrendsRes,
        documentAnalyticsRes,
        transactionChartRes
      ] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/analytics/monthly-trends'),
        fetch('/api/documents/analytics'),
        fetch('/api/transactions/chart?period=6months')
      ])

      if (dashboardStatsRes.ok && monthlyTrendsRes.ok) {
        const [dashboardStats, monthlyTrends, documentAnalytics, transactionData] = await Promise.all([
          dashboardStatsRes.json(),
          monthlyTrendsRes.json(),
          documentAnalyticsRes.ok ? documentAnalyticsRes.json() : Promise.resolve({ data: null }),
          transactionChartRes.ok ? transactionChartRes.json() : Promise.resolve({ data: null })
        ])

        const stats = dashboardStats?.data || {}
        const monthlyTrendsData = monthlyTrends?.data || []
        const docAnalytics = documentAnalytics?.data || {}
        const financialData = transactionData?.data || {}

        // Calculate derived metrics
        const totalUsers = Number(stats.totalUsers || 0)
        const presentToday = Number(stats.todayPresent || 0)
        const absentToday = Number(stats.todayAbsent || 0)
        const wfhToday = Number(stats.todayWFH || 0)
        const leaveToday = 0
        const totalTasks = Number(stats.totalTasks || 0)
        const completedTasks = Number(stats.completedTasks || 0)
        const pendingTasks = Number(stats.pendingTasks || 0)
        const pendingRequests = Number(stats.pendingLeaveRequests || 0) + Number(stats.pendingWFHLogs || 0)

        const attendanceRate = totalUsers > 0 ? ((presentToday + wfhToday) / totalUsers) * 100 : 0
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

        setAnalytics({
          // User Analytics
          totalUsers,
          activeUsers: presentToday + wfhToday,
          pendingUsers: Number(stats.pendingUsers || 0),
          approvedUsers: Number(stats.approvedUsers || 0),
          rejectedUsers: Number(stats.rejectedUsers || 0),
          
          // Attendance Analytics
          totalAttendance: totalUsers,
          presentToday,
          absentToday,
          wfhToday,
          leaveToday,
          attendanceRate,
          
          // Task Analytics
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks: Number(stats.pendingTasks || 0),
          overdueTasks: 0, // This would need to be calculated based on due dates
          taskCompletionRate,
          
          // Request Analytics
          pendingRequests,
          approvedRequests: Number(stats.approvedLeaveRequests || 0) + Number(stats.approvedWFHLogs || 0),
          rejectedRequests: Number(stats.rejectedLeaveRequests || 0) + Number(stats.rejectedWFHLogs || 0),
          
          // Document Analytics
          totalDocuments: docAnalytics.overview?.totalDocs || 0,
          recentUploads: docAnalytics.overview?.recentUploads || 0,
          totalDownloads: docAnalytics.overview?.totalDownloads || 0,
          storageUsed: docAnalytics.overview?.totalSize || 0,
          
          // Financial Analytics
          totalIncome: financialData.summary?.totalIncome || 0,
          totalExpense: financialData.summary?.totalExpense || 0,
          netIncome: financialData.summary?.netIncome || 0,
          
          // Trends
          monthlyTrend: monthlyTrendsData,
          
          // Performance Metrics (mock data for now)
          systemUptime: 99.9,
          responseTime: 120,
          errorRate: 0.1
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Memuat Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">Mengambil data terbaru...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Tidak ada data analytics</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Coba refresh halaman atau hubungi administrator.</p>
          <button
            onClick={fetchAnalyticsData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-12 bg-gradient-to-b from-blue-500 via-green-500 to-purple-500 rounded-full shadow-lg"></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Ringkasan performa sistem dan karyawan secara real-time</p>
          </div>
        </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">90 Hari Terakhir</option>
              <option value="1y">1 Tahun Terakhir</option>
            </select>
            
            {/* Last Updated */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 px-4 py-2 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <Clock className="w-4 h-4" />
              <span>Terakhir diupdate: {lastUpdated.toLocaleTimeString('id-ID')}</span>
              </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchAnalyticsData}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            </div>
          </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'attendance', label: 'Kehadiran', icon: Calendar },
              { id: 'tasks', label: 'Tugas', icon: Target },
              { id: 'financial', label: 'Keuangan', icon: DollarSign },
              { id: 'documents', label: 'Dokumen', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'attendance' | 'tasks' | 'financial' | 'documents')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
              </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-500/20 rounded-xl border border-${stat.color}-500/30`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
                <div className="flex items-center space-x-1">
                  {stat.changeType === 'positive' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                  {stat.changeType === 'negative' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  {stat.changeType === 'neutral' && <Minus className="w-4 h-4 text-gray-500" />}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </span>
            </div>
          </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{stat.description}</p>
              </div>
            </div>
          ))}
          </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Attendance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribusi Kehadiran Hari Ini</h3>
                  <Calendar className="w-5 h-5 text-blue-500" />
              </div>
                <div className="space-y-4">
                  {attendanceChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
              </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
            </div>
                  ))}
          </div>
        </div>

          <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan Sistem</h3>
                  <Activity className="w-5 h-5 text-purple-500" />
            </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Uptime Sistem</span>
                </div>
                    <span className="font-semibold text-green-600 dark:text-green-400">{analytics.systemUptime}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Response Time</span>
                </div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{analytics.responseTime}ms</span>
              </div>
              
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Error Rate</span>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">{analytics.errorRate}%</span>
                </div>
              </div>
            </div>
          </div>

            {/* Monthly Trends */}
            <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Bulanan</h3>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
              <div className="overflow-x-auto">
                <div className="min-w-full">
              {analytics.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl mb-3 last:mb-0">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">{month.month}</span>
                      <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{month.leave}</span>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Hadir Hari Ini</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.presentToday}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-2xl">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">WFH Hari Ini</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.wfhToday}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-2xl">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tidak Hadir</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.absentToday}</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-2xl">
                    <UserX className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tingkat Kehadiran</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.attendanceRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Tugas</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalTasks}</p>
                  </div>
                  <div className="p-3 bg-gray-500/20 rounded-2xl">
                    <Briefcase className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tugas Selesai</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.completedTasks}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tugas Pending</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{analytics.pendingTasks}</p>
                  </div>
                  <div className="p-3 bg-amber-500/20 rounded-2xl">
                    <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tingkat Penyelesaian</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.taskCompletionRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-2xl">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
          <TransactionChart />
        </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Dokumen</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalDocuments}</p>
                  </div>
                  <div className="p-3 bg-gray-500/20 rounded-2xl">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Upload Terbaru</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.recentUploads}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-2xl">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Download</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.totalDownloads}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-2xl">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Storage Used</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatFileSize(analytics.storageUsed)}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-2xl">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white/95 dark:bg-[#1e293b] rounded-2xl border border-gray-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aksi Cepat</h3>
            <Zap className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              href="/admin/leave-requests" 
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

            <a 
              href="/admin/documents" 
              className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/20 dark:hover:to-purple-800/30 rounded-2xl transition-all duration-300 group border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg hover:scale-[1.02]"
            >
              <FileText className="w-6 h-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Kelola Dokumen</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload dan kelola file</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
