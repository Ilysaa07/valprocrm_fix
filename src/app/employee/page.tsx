'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'
import { RefreshCw } from 'lucide-react'

interface EmployeeStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  revisionTasks: number
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

interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'REVISION' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  deadline: string
  createdAt: string
  updatedAt: string
  assigneeId: string
  assigneeName: string
  validationMessage?: string
}

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  category: string
  createdAt: string
}

export default function EmployeeDashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }
  const socketRef = useRef<MinimalSocket | null>(null)

  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', [])

  const fetchEmployeeStats = useCallback(async () => {
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
      let revisionTasks = 0
      if (tasksRes.ok) {
        const tasksJson = await tasksRes.json()
        const tasks: Task[] = tasksJson.tasks || tasksJson.data || []
        totalTasks = tasks.length
        completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
        pendingTasks = tasks.filter(t => t.status === 'NOT_STARTED' || t.status === 'IN_PROGRESS' || t.status === 'PENDING_VALIDATION').length
        revisionTasks = tasks.filter(t => t.status === 'REVISION').length
      }

      let unreadNotifications = 0
      if (notifsRes.ok) {
        const nj = await notifsRes.json()
        unreadNotifications = typeof nj.unreadCount === 'number' ? nj.unreadCount : (nj.notifications?.filter((n: Notification) => !n.isRead).length || 0)
      }

      let todayPresent = false
      let checkInTime: string | undefined = undefined
      let checkOutTime: string | undefined = undefined
      if (attendanceRes.ok) {
        const aj = await attendanceRes.json()
        const today = (aj.data || aj.attendance || aj || []) as unknown[]
        const latest = Array.isArray(today) && today.length > 0 ? today[0] as any : null
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
        const leaves: unknown[] = lj.data || lj.leaveRequests || []
        pendingLeaveRequests = leaves.filter((l: any) => l.status === 'PENDING').length
        approvedLeaveRequests = leaves.filter((l: any) => l.status === 'APPROVED').length
        rejectedLeaveRequests = leaves.filter((l: any) => l.status === 'REJECTED').length
      }

      let pendingWFHLogs = 0
      let approvedWFHLogs = 0
      let rejectedWFHLogs = 0
      if (wfhRes.ok) {
        const wj = await wfhRes.json()
        const logs: unknown[] = wj.data || []
        pendingWFHLogs = logs.filter((l: any) => l.status === 'PENDING').length
        approvedWFHLogs = logs.filter((l: any) => l.status === 'APPROVED').length
        rejectedWFHLogs = logs.filter((l: any) => l.status === 'REJECTED').length
      }

      const computed: EmployeeStats = {
        totalTasks,
        completedTasks,
        pendingTasks,
        revisionTasks,
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
  }, [])


  const fetchRecentTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?limit=5&sort=createdAt:desc')
      if (res.ok) {
        const data = await res.json()
        setRecentTasks((data.tasks || data.data || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching recent tasks:', error)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=5')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [])

  const refreshAll = useCallback(() => {
    fetchEmployeeStats()
    fetchRecentTasks()
    fetchNotifications()
  }, [fetchEmployeeStats, fetchRecentTasks, fetchNotifications])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/login')
    }

    if (session.user.role !== 'EMPLOYEE') {
      redirect('/admin')
    }

    refreshAll()

    // polling for freshness
    pollingRef.current = setInterval(() => {
      refreshAll()
    }, 60000)

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
  }, [session, status, appUrl, refreshAll])

  if (status === 'loading' || isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            <p className="text-text-secondary">Memuat dashboard...</p>
          </div>
        </div>
      </EmployeeLayout>
    )
  }

  if (!stats) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">😕</div>
            <h2 className="text-2xl font-bold text-text-primary">
              Gagal memuat data dashboard
            </h2>
            <p className="text-text-secondary">
              Terjadi kesalahan saat memuat data dashboard
            </p>
            <button
              onClick={fetchEmployeeStats}
              className="px-6 py-3 bg-accent text-text-inverse rounded-lg hover:bg-accent-hover transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="p-6">
        <EmployeeDashboard
          stats={stats}
          recentTasks={recentTasks}
          notifications={notifications}
          isLoading={isLoading}
          onRefresh={refreshAll}
        />
      </div>
    </EmployeeLayout>
  )
}