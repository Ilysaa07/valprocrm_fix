"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  AnalyticsHeader,
  SwipeableTabNavigation,
  ResponsiveMetricsGrid,
  EnhancedChart,
  type Metric
} from '@/components/analytics'
import { 
  Users, 
  Calendar, 
  CheckCircle,
  Clock, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Activity,
  Target
} from 'lucide-react'

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

type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<EnhancedAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'tasks' | 'financial' | 'documents'>('overview')

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
        const mod = (await import('socket.io-client')) as unknown
        const { io } = mod as { io: () => MinimalSocket }
        const socket = io()
        
        socket.on('analytics_update', () => {
          fetchAnalyticsData()
        })
        
        socketRef.current = socket
      } catch (error) {
        console.warn('Socket connection failed:', error)
      }
    })()

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

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
          activeUsers: totalUsers,
          pendingUsers: Number(stats.pendingUsers || 0),
          approvedUsers: totalUsers,
          rejectedUsers: 0,
          
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
          inProgressTasks: pendingTasks,
          overdueTasks: 0,
          taskCompletionRate,
          
          // Request Analytics
          pendingRequests,
          approvedRequests: 0,
          rejectedRequests: 0,
          
          // Document Analytics
          totalDocuments: Number(docAnalytics.totalDocuments || 0),
          recentUploads: Number(docAnalytics.recentUploads || 0),
          totalDownloads: Number(docAnalytics.totalDownloads || 0),
          storageUsed: Number(docAnalytics.storageUsed || 0),
          
          // Financial Analytics
          totalIncome: Number(financialData.totalIncome || 0),
          totalExpense: Number(financialData.totalExpense || 0),
          netIncome: Number(financialData.totalIncome || 0) - Number(financialData.totalExpense || 0),
          
          // Trends
          monthlyTrend: monthlyTrendsData,
          
          // Performance Metrics
          systemUptime: 99.9,
          responseTime: 120,
          errorRate: 0.1
        })

        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate metrics based on active tab
  const metrics: Metric[] = useMemo(() => {
    if (!analytics) return []

    const baseMetrics: Metric[] = [
      {
        title: 'Total Karyawan',
        value: analytics.totalUsers,
        change: 5,
        trend: 'up',
        format: 'number',
        icon: Users,
        color: 'blue',
        drillDown: true
      },
      {
        title: 'Kehadiran Hari Ini',
        value: analytics.presentToday,
        change: 2,
        trend: 'up',
        format: 'number',
        icon: Calendar,
        color: 'green',
        drillDown: true
      },
      {
        title: 'Tugas Selesai',
        value: analytics.completedTasks,
        change: 8,
        trend: 'up',
        format: 'number',
        icon: CheckCircle,
        color: 'green',
        drillDown: true
      },
      {
        title: 'Izin Pending',
        value: analytics.pendingRequests,
        change: -3,
        trend: 'down',
        format: 'number',
        icon: Clock,
        color: 'yellow',
        drillDown: true
      },
      {
        title: 'Uptime Sistem',
        value: analytics.systemUptime,
        change: 0,
        trend: 'stable',
        format: 'percentage',
        icon: Activity,
        color: 'purple'
      },
      {
        title: 'Response Time',
        value: analytics.responseTime,
        change: -5,
        trend: 'down',
        format: 'time',
        icon: TrendingUp,
        color: 'blue'
      }
    ]

    switch (activeTab) {
      case 'attendance':
        return [
          {
            title: 'Hadir Hari Ini',
            value: analytics.presentToday,
            change: 2,
            trend: 'up',
            format: 'number',
            icon: CheckCircle,
            color: 'green',
            drillDown: true
          },
          {
            title: 'WFH Hari Ini',
            value: analytics.wfhToday,
            change: 1,
            trend: 'up',
            format: 'number',
            icon: Calendar,
            color: 'purple',
            drillDown: true
          },
          {
            title: 'Tidak Hadir',
            value: analytics.absentToday,
            change: -2,
            trend: 'down',
            format: 'number',
            icon: AlertCircle,
            color: 'red',
            drillDown: true
          }
        ]
      
      case 'tasks':
        return [
          {
            title: 'Total Tugas',
            value: analytics.totalTasks,
            change: 3,
            trend: 'up',
            format: 'number',
            icon: Target,
            color: 'blue',
            drillDown: true
          },
          {
            title: 'Tugas Selesai',
            value: analytics.completedTasks,
            change: 8,
            trend: 'up',
            format: 'number',
            icon: CheckCircle,
            color: 'green',
            drillDown: true
          },
          {
            title: 'Tugas Pending',
            value: analytics.pendingTasks,
            change: -5,
            trend: 'down',
            format: 'number',
            icon: Clock,
            color: 'yellow',
            drillDown: true
          }
        ]
      
      case 'financial':
        return [
          {
            title: 'Total Pendapatan',
            value: analytics.totalIncome,
            change: 12,
            trend: 'up',
            format: 'currency',
            icon: DollarSign,
            color: 'green',
            drillDown: true
          },
          {
            title: 'Total Pengeluaran',
            value: analytics.totalExpense,
            change: 7,
            trend: 'up',
            format: 'currency',
            icon: DollarSign,
            color: 'red',
            drillDown: true
          },
          {
            title: 'Net Income',
            value: analytics.netIncome,
            change: 15,
            trend: 'up',
            format: 'currency',
            icon: TrendingUp,
            color: 'blue',
            drillDown: true
          }
        ]
      
      default:
        return baseMetrics
    }
  }, [analytics, activeTab])

  // Generate charts based on active tab
  const charts: Array<{
    title: string
    subtitle?: string
    type: 'bar' | 'pie' | 'line' | 'area'
    data: Array<{ label: string; value: number; color?: string }>
    showLegend?: boolean
    showTotal?: boolean
  }> = useMemo(() => {
    if (!analytics) return []

    switch (activeTab) {
      case 'overview':
        return [
          {
            title: 'Distribusi Kehadiran Hari Ini',
            subtitle: 'Status kehadiran karyawan',
            type: 'pie',
            data: [
              { label: 'Hadir', value: analytics.presentToday, color: '#10B981' },
              { label: 'WFH', value: analytics.wfhToday, color: '#8B5CF6' },
              { label: 'Tidak Hadir', value: analytics.absentToday, color: '#EF4444' }
            ],
            showLegend: true,
            showTotal: true
          },
          {
            title: 'Status Tugas',
            subtitle: 'Progress penyelesaian tugas',
            type: 'bar',
            data: [
              { label: 'Selesai', value: analytics.completedTasks, color: '#10B981' },
              { label: 'Dalam Progress', value: analytics.pendingTasks, color: '#F59E0B' },
              { label: 'Belum Dimulai', value: analytics.totalTasks - analytics.completedTasks - analytics.pendingTasks, color: '#6B7280' }
            ],
            showLegend: false,
            showTotal: false
          }
        ]
      
      case 'attendance':
        return [
          {
            title: 'Trend Kehadiran Bulanan',
            subtitle: 'Data kehadiran 6 bulan terakhir',
            type: 'bar',
            data: analytics.monthlyTrend.map(trend => ({
              label: trend.month,
              value: trend.present,
              color: '#10B981'
            })),
            showLegend: false,
            showTotal: false
          }
        ]
      
      default:
        return []
    }
  }, [analytics, activeTab])

  const handleExport = () => {
    console.log('Exporting analytics data...')
  }

  const handleMetricClick = (metric: Metric) => {
    console.log('Drilling down to:', metric.title)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <AnalyticsHeader
          title="Analytics Dashboard"
          subtitle="Ringkasan performa sistem dan karyawan secara real-time"
          lastUpdated={lastUpdated}
          selectedPeriod={selectedPeriod}
          onPeriodChange={(period) => setSelectedPeriod(period as '7d' | '30d' | '90d' | '1y')}
          onRefresh={fetchAnalyticsData}
          onExport={handleExport}
          loading={isLoading}
        />

        {/* Tab Navigation */}
        <SwipeableTabNavigation
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'overview' | 'attendance' | 'tasks' | 'financial' | 'documents')}
        />

        {/* Metrics Grid */}
        <ResponsiveMetricsGrid
          metrics={metrics.map(metric => ({
            ...metric,
            onClick: () => handleMetricClick(metric)
          }))}
          loading={isLoading}
        />

        {/* Charts */}
        {charts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {charts.map((chart, index) => (
              <EnhancedChart
                key={index}
                title={chart.title}
                subtitle={chart.subtitle}
                type={chart.type}
                data={chart.data}
                showLegend={chart.showLegend}
                showTotal={chart.showTotal}
                onExport={handleExport}
                onDrillDown={(data) => console.log('Chart drill down:', data)}
                loading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}