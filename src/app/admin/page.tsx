"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }
import { 
  DashboardLayout, 
  DashboardSection,
  // adminStatConfigs,
  ActivityFeed,
  adminActivityFeed,
  WelcomeSection,
  adminWelcomeConfig,
  // adminSummaryCards,
  ChartSummary,
  attendanceChartConfig,
  // taskProgressChartConfig,
  // leaveStatusChartConfig,
  QuickStats,
  adminQuickStats,
  // ProgressOverview,
  // taskProgressConfig,
  // attendanceProgressConfig,
  // attendanceOverviewConfig,
  // leaveOverviewConfig,
  // wfhOverviewConfig,
  // NotificationsSummary
} from '@/components/dashboard'
import CalendarWidget from '@/components/calendar/CalendarWidget'

interface DashboardStats {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  rejectedUsers: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  todayPresent: number
  todayAbsent: number
  todayWFH: number
  pendingLeaveRequests: number
  approvedLeaveRequests: number
  rejectedLeaveRequests: number
  pendingWFHLogs: number
  approvedWFHLogs: number
  rejectedWFHLogs: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])
  const [mounted, setMounted] = useState(false)
  // const [recentTasks, setRecentTasks] = useState([])
  // const [notifications, setNotifications] = useState([])
  
  const socketRef = useRef<MinimalSocket | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
    }

    if (session.user.role !== 'ADMIN') {
      redirect('/employee')
    }

    // initial fetch
    fetchStats()
    fetchRecentActivities()
    // fetchRecentTasks()
    // fetchNotifications()
    

    // light polling for freshness
    pollingRef.current = setInterval(() => {
      fetchStats()
      fetchRecentActivities()
      // fetchRecentTasks()
      // fetchNotifications()
      
    }, 30000)

    // socket trigger to refresh on important events
    ;(async () => {
      try {
        const mod = (await import('socket.io-client')) as unknown as { io?: (url: string, opts: Record<string, unknown>) => MinimalSocket; default?: (url: string, opts: Record<string, unknown>) => MinimalSocket }
        const factory: (url: string, opts: Record<string, unknown>) => MinimalSocket = (mod.io || mod.default) as (url: string, opts: Record<string, unknown>) => MinimalSocket
        const s = factory(appUrl, { path: '/socket.io' })
        socketRef.current = s
        const refresh = () => {
          fetchStats()
          fetchRecentActivities()
          // fetchRecentTasks()
          // fetchNotifications()
          
        }
        s.on('notification', refresh)
        s.on('task_updated', refresh)
        s.on('task_created', refresh)
        s.on('attendance_updated', refresh)
        s.on('leave_status_changed', refresh)
      } catch {}
    })()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [mounted, session, status, appUrl])

  //

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/dashboard-stats')
      
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      } else {
        console.error('Error fetching dashboard stats:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities/recent')
      if (response.ok) {
        const result = await response.json()
        setRecentActivities(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    }
  }

  // const fetchRecentTasks = async () => {}

  // const fetchNotifications = async () => {}

  

  if (!mounted || status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Gagal memuat data dashboard
          </h2>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // Generate configurations using the new dashboard components
  // const statConfigs = adminStatConfigs(stats)
  // const summaryCards = adminSummaryCards(stats)
  const quickStats = adminQuickStats(stats)
  // simplified overview no longer uses progressItems
  // const overviewItems = { attendance: attendanceOverviewConfig(stats), leave: leaveOverviewConfig(stats), wfh: wfhOverviewConfig(stats) }
  const activities = adminActivityFeed(recentActivities)
  const welcomeConfig = {
    ...adminWelcomeConfig(session?.user, new Date()),
    user: session?.user
  }

  // ChartSummary uses derived arrays from stats via config functions

  return (
    <AdminLayout>
      <DashboardLayout>
      {/* Welcome Section */}
      <DashboardSection>
        <WelcomeSection {...welcomeConfig} />
      </DashboardSection>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Stats - spans 2 columns */}
        <div className="lg:col-span-2">
          <DashboardSection title="Statistik Cepat">
            <QuickStats items={quickStats} />
          </DashboardSection>
        </div>
        
        {/* Calendar Widget - spans 1 column */}
        <div className="lg:col-span-1">
          <CalendarWidget />
        </div>
      </div>

      <div className="space-y-8">
        {/* Charts Section */}
        <DashboardSection title="Analisis Kehadiran">
          <div className="bg-white/90 dark:bg-neutral-900/90 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-8 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <ChartSummary {...attendanceChartConfig(stats)} />
          </div>
        </DashboardSection>
      </div>

      {/* Full Width Sections */}
      {/* Removed extra stat cards to keep overview clean */}

      {/* Summary Cards */}
      {/* Removed summary cards to reduce clutter */}

      {/* Charts Section (concise) */}
      {/* Simplified: charts moved above; remove extra blocks */}

      {/* Transactions Overview */}
      {/* Transactions section moved up with charts */}

      {/* Activity Feed */}
      <DashboardSection title="Aktivitas Terbaru">
        <ActivityFeed activities={activities || []} />
      </DashboardSection>
      </DashboardLayout>
    </AdminLayout>
  )
}

