'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  DashboardLayout, 
  TwoColumnLayout,
  DashboardSection,
  StatCard, 
  employeeStatConfigs,
  QuickActions,
  employeeQuickActions,
  ActivityFeed,
  employeeActivityFeed,
  WelcomeSection,
  employeeWelcomeConfig,
  SummaryCards,
  employeeSummaryCards,
  ChartSummary,
  attendanceChartConfig,
  taskProgressChartConfig,
  leaveStatusChartConfig,
  QuickStats,
  employeeQuickStats,
  ProgressOverview,
  taskProgressConfig,
  attendanceProgressConfig,
  OverviewCards,
  attendanceOverviewConfig,
  leaveOverviewConfig,
  wfhOverviewConfig,
  RecentTasks,
  NotificationsSummary,
  AttendanceStatus,
  DashboardCalendar,
  attendanceCalendarConfig,
  generateSampleEvents
} from '@/components/dashboard'
import type { ActivityItem, Task, Notification, AttendanceData, CalendarEvent } from '@/components/dashboard/types'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

interface EmployeeStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  todayPresent: boolean
  checkInTime?: string
  checkOutTime?: string
  pendingLeaveRequests: number
  approvedLeaveRequests: number
  rejectedLeaveRequests: number
  pendingWFHLogs: number
  approvedWFHLogs: number
  rejectedWFHLogs: number
  unreadNotifications: number
}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }
  const socketRef = useRef<MinimalSocket | null>(null)

  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', [])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
    }

    if (session.user.role !== 'EMPLOYEE') {
      redirect('/admin')
    }

    refreshAll()

    // polling for freshness
    pollingRef.current = setInterval(() => {
      refreshAll()
    }, 30000)

    // socket trigger to refresh on important events
    ;(async () => {
      try {
        const mod = (await import('socket.io-client')) as unknown as { io?: (url: string, opts: Record<string, unknown>) => MinimalSocket; default?: (url: string, opts: Record<string, unknown>) => MinimalSocket }
        const factory: (url: string, opts: Record<string, unknown>) => MinimalSocket = (mod.io || mod.default) as (url: string, opts: Record<string, unknown>) => MinimalSocket
        const s = factory(appUrl, { path: '/socket.io' })
        socketRef.current = s
        const refresh = () => refreshAll()
        s.on('task_updated', refresh)
        s.on('task_created', refresh)
        s.on('notification', refresh)
        s.on('attendance_updated', refresh)
        s.on('leave_status_changed', refresh)
      } catch {}
    })()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [session, status, appUrl])

  const refreshAll = () => {
    fetchEmployeeStats()
    fetchRecentActivities()
    fetchRecentTasks()
    fetchNotifications()
    fetchAttendanceData()
    fetchCalendarEvents()
  }

  const fetchEmployeeStats = async () => {
    try {
      setIsLoading(true)

      // Use the new employee dashboard stats API
      const statsRes = await fetch('/api/employee/dashboard-stats')
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success && statsData.data) {
          setStats(statsData.data)
          setIsLoading(false)
          return
        }
      }

      // Fallback to individual API calls if new endpoint fails
      const [tasksRes, notifsRes, attendanceRes, leavesRes, wfhRes] = await Promise.all([
        fetch('/api/tasks?limit=100'),
        fetch('/api/notifications?unread=true&limit=1'),
        fetch('/api/attendance/today'),
        fetch('/api/leave-requests/me'),
        fetch('/api/wfh-logs/me')
      ])

      let totalTasks = 0
      let completedTasks = 0
      let pendingTasks = 0
      if (tasksRes.ok) {
        const tasksJson = await tasksRes.json()
        const tasks: any[] = tasksJson.tasks || tasksJson.data || []
        totalTasks = tasks.length
        completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
        pendingTasks = tasks.filter(t => t.status === 'NOT_STARTED' || t.status === 'IN_PROGRESS').length
      }

      let unreadNotifications = 0
      if (notifsRes.ok) {
        const nj = await notifsRes.json()
        unreadNotifications = typeof nj.unreadCount === 'number' ? nj.unreadCount : (nj.notifications?.filter((n: any) => !n.isRead).length || 0)
      }

      let todayPresent = false
      let checkInTime: string | undefined = undefined
      let checkOutTime: string | undefined = undefined
      if (attendanceRes.ok) {
        const aj = await attendanceRes.json()
        const today = (aj.data || aj.attendance || aj || []) as any[]
        const latest = Array.isArray(today) && today.length > 0 ? today[0] : null
        if (latest) {
          todayPresent = latest.status === 'PRESENT' || latest.status === 'WFH' || latest.status === 'LEAVE' || latest.status === 'SICK'
          checkInTime = latest.checkInTime
          checkOutTime = latest.checkOutTime
        }
      }

      let pendingLeaveRequests = 0
      let approvedLeaveRequests = 0
      let rejectedLeaveRequests = 0
      if (leavesRes.ok) {
        const lj = await leavesRes.json()
        const leaves: any[] = lj.data || lj.leaveRequests || []
        pendingLeaveRequests = leaves.filter(l => l.status === 'PENDING').length
        approvedLeaveRequests = leaves.filter(l => l.status === 'APPROVED').length
        rejectedLeaveRequests = leaves.filter(l => l.status === 'REJECTED').length
      }

      let pendingWFHLogs = 0
      let approvedWFHLogs = 0
      let rejectedWFHLogs = 0
      if (wfhRes.ok) {
        const wj = await wfhRes.json()
        const logs: any[] = wj.data || []
        pendingWFHLogs = logs.filter(l => l.status === 'PENDING').length
        approvedWFHLogs = logs.filter(l => l.status === 'APPROVED').length
        rejectedWFHLogs = logs.filter(l => l.status === 'REJECTED').length
      }

      const computed: EmployeeStats = {
        totalTasks,
        completedTasks,
        pendingTasks,
        todayPresent,
        checkInTime,
        checkOutTime,
        pendingLeaveRequests,
        approvedLeaveRequests,
        rejectedLeaveRequests,
        pendingWFHLogs,
        approvedWFHLogs,
        rejectedWFHLogs,
        unreadNotifications
      }
      setStats(computed)
    } catch (error) {
      console.error('Error fetching employee stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        const items: ActivityItem[] = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.category || 'notification',
          title: n.title,
          description: n.message,
          timestamp: n.createdAt,
          user: session?.user?.name || 'Anda',
          icon: 'Bell',
          color: n.isRead ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800',
          metadata: { isRead: n.isRead }
        }))
        setRecentActivities(items)
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    }
  }

  const fetchRecentTasks = async () => {
    try {
      const res = await fetch('/api/tasks?limit=5&sort=createdAt:desc')
      if (res.ok) {
        const data = await res.json()
        setRecentTasks((data.tasks || data.data || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching recent tasks:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=5')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      const res = await fetch('/api/attendance/today')
      if (res.ok) {
        const data = await res.json()
        const list: any[] = data.data || data.attendance || []
        const latest = Array.isArray(list) && list.length > 0 ? list[0] : null
        if (latest) {
          const mapped: AttendanceData = {
            userId: session?.user?.id || '',
            userName: session?.user?.name || 'Anda',
            status: latest.status,
            checkInTime: latest.checkInTime,
            checkOutTime: latest.checkOutTime,
            location: latest.checkInLatitude && latest.checkInLongitude ? `${latest.checkInLatitude}, ${latest.checkInLongitude}` : undefined,
            notes: latest.notes,
          }
          setAttendanceData(mapped)
        } else {
          setAttendanceData(null)
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error)
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      const res = await fetch(`/api/attendance/calendar?month=${month}&year=${year}`)
      if (res.ok) {
        const data = await res.json()
        const events: CalendarEvent[] = []
        const attendance = data?.data?.attendance || []
        for (const a of attendance) {
          events.push({
            id: a.id,
            title: a.status,
            date: a.checkInTime,
            type: 'attendance'
          })
        }
        setCalendarEvents(events)
      } else {
        const events = generateSampleEvents()
        setCalendarEvents(events)
      }
    } catch {
      const events = generateSampleEvents()
      setCalendarEvents(events)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#121212]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Gagal memuat data dashboard
          </h2>
          <button
            onClick={fetchEmployeeStats}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // Generate configurations using the new dashboard components
  const statConfigs = employeeStatConfigs(stats)
  const summaryCards = employeeSummaryCards(stats)
  const quickStatsConfig = employeeQuickStats(stats)
  const progressItems = {
    tasks: stats ? taskProgressConfig(stats) : [],
    attendance: stats ? attendanceProgressConfig(stats) : []
  }
  
  // Ensure progressItems.tasks is always an array
  const safeProgressItems = {
    tasks: Array.isArray(progressItems?.tasks) ? progressItems.tasks : [],
    attendance: Array.isArray(progressItems?.attendance) ? progressItems.attendance : []
  }
  const overviewItems = {
    attendance: { items: stats ? attendanceOverviewConfig(stats) : [] },
    leave: { items: stats ? leaveOverviewConfig(stats) : [] },
    wfh: { items: stats ? wfhOverviewConfig(stats) : [] }
  }
  const activities = employeeActivityFeed(recentActivities)
  const welcomeConfig = {
    ...employeeWelcomeConfig(session?.user, new Date()),
    user: session?.user
  }

  // Mock chart data for employee
  const chartData = {
    attendance: {
      labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      datasets: [{
        label: 'Kehadiran',
        data: [1, 1, 1, 1, 1], // Present for all days
        backgroundColor: ['#10B981', '#10B981', '#10B981', '#10B981', '#10B981'],
        borderColor: ['#059669', '#059669', '#059669', '#059669', '#059669'],
        borderWidth: 2
      }]
    },
    tasks: {
      labels: ['Belum Dimulai', 'Dalam Proses', 'Selesai'],
      datasets: [{
        label: 'Tugas',
        data: [0, stats.pendingTasks, stats.completedTasks],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
        borderColor: ['#D97706', '#2563EB', '#059669'],
        borderWidth: 2
      }]
    },
    leave: {
      labels: ['Menunggu', 'Disetujui', 'Ditolak'],
      datasets: [{
        label: 'Permohonan Izin',
        data: [stats.pendingLeaveRequests, stats.approvedLeaveRequests, stats.rejectedLeaveRequests],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#D97706', '#059669', '#DC2626'],
        borderWidth: 2
      }]
    }
  }

  return (
    <EmployeeLayout>
    <DashboardLayout>
      {/* Welcome Section */}
      <DashboardSection>
        <WelcomeSection {...welcomeConfig} />
      </DashboardSection>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <DashboardSection title="Statistik Cepat">
            <QuickStats items={quickStatsConfig.items} />
          </DashboardSection>

          {/* Charts Section */}
          <DashboardSection title="Analisis Performa">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartSummary {...attendanceChartConfig(stats)} />
              <ChartSummary {...taskProgressChartConfig(stats)} />
            </div>
          </DashboardSection>

          {/* Progress Overview */}
          <DashboardSection title="Progress Tugas">
            <ProgressOverview items={safeProgressItems.tasks} />
          </DashboardSection>
        </div>

        {/* Right Column - Actions and Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <DashboardSection title="Aksi Cepat">
            <QuickActions actions={employeeQuickActions} />
          </DashboardSection>

          {/* Attendance Status */}
          <DashboardSection title="Status Kehadiran">
            <AttendanceStatus 
              attendanceData={attendanceData}
              showActions={true}
              showLocation={true}
            />
          </DashboardSection>

          {/* Notifications Summary */}
          <DashboardSection title="Notifikasi">
            <NotificationsSummary 
              notifications={notifications}
              maxItems={3}
              showMarkAsRead={true}
            />
          </DashboardSection>

          {/* Recent Tasks */}
          <DashboardSection title="Tugas Terbaru">
            <RecentTasks 
              tasks={recentTasks}
              maxItems={3}
              showAssignee={false}
              showProgress={true}
            />
          </DashboardSection>
        </div>
      </div>

      {/* Overview Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardSection title="Kehadiran">
          <OverviewCards {...overviewItems.attendance} />
        </DashboardSection>
        
        <DashboardSection title="Izin">
          <OverviewCards {...overviewItems.leave} />
        </DashboardSection>
        
        <DashboardSection title="WFH">
          <OverviewCards {...overviewItems.wfh} />
        </DashboardSection>
      </div>

      {/* Detailed Analytics */}
      <DashboardSection title="Analisis Detail">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
            <ChartSummary {...leaveStatusChartConfig(stats)} />
          </div>
          <div className="bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
            <DashboardCalendar 
              events={calendarEvents}
              {...attendanceCalendarConfig}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Activity Feed */}
      <DashboardSection title="Aktivitas Terbaru">
        <div className="bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 backdrop-blur-sm">
          <ActivityFeed activities={activities || []} />
        </div>
      </DashboardSection>
    </DashboardLayout>
    </EmployeeLayout>
  )
}