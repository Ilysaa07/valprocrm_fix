"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  DashboardLayout, 
  DashboardSection,
  DashboardGrid,
  DashboardCard,
  DashboardStatCard,
  DashboardMetricCard,
  ThreeColumnLayout,
  FourColumnLayout
} from '@/components/dashboard'
import { 
  ActivityFeed,
  adminActivityFeed,
  WelcomeSection,
  adminWelcomeConfig,
  ChartSummary,
  attendanceChartConfig,
  QuickStats,
  adminQuickStats,
} from '@/components/dashboard'
import { 
  Users, 
  CheckSquare, 
  Clock, 
  Calendar, 
  FileText, 
  Receipt,
  TrendingUp,
  UserCheck
} from 'lucide-react'

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

    // light polling for freshness
    pollingRef.current = setInterval(() => {
      fetchStats()
      fetchRecentActivities()
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

  const quickStats = adminQuickStats(stats)
  const activities = adminActivityFeed(recentActivities)
  const welcomeConfig = {
    ...adminWelcomeConfig(session?.user, new Date()),
    user: {
      name: session?.user?.name,
      role: session?.user?.role,
      image: session?.user?.image,
      profilePicture: session?.user?.image
    }
  }

  return (
    <AdminLayout>
      <DashboardLayout>
        {/* Welcome Section */}
        <DashboardSection>
          <WelcomeSection {...welcomeConfig} />
        </DashboardSection>

        {/* Key Metrics Overview */}
        <DashboardSection title="Ringkasan Utama">
          <div className="w-full max-w-screen-sm mx-auto sm:max-w-none sm:mx-0 px-3 sm:px-0">
          <DashboardGrid cols={4} gap="md">
            <DashboardStatCard
              title="Total Pengguna"
              value={stats.totalUsers}
              description="Karyawan terdaftar"
              icon={Users}
              trend={{
                value: 12,
                isPositive: true,
                period: "dari bulan lalu"
              }}
            />
            <DashboardStatCard
              title="Tugas Aktif"
              value={stats.pendingTasks}
              description="Menunggu penyelesaian"
              icon={CheckSquare}
              trend={{
                value: 0,
                isPositive: true,
                period: "Stabil"
              }}
            />
            <DashboardStatCard
              title="Kehadiran Hari Ini"
              value={stats.todayPresent}
              description={`dari ${stats.totalUsers} karyawan`}
              icon={UserCheck}
              trend={{
                value: 5,
                isPositive: true,
                period: "dari kemarin"
              }}
            />
            <DashboardStatCard
              title="Permintaan Cuti"
              value={stats.pendingLeaveRequests}
              description="Menunggu persetujuan"
              icon={Calendar}
              trend={{
                value: 8,
                isPositive: false,
                period: "dari minggu lalu"
              }}
            />
          </DashboardGrid>
          </div>
        </DashboardSection>

        {/* Main Dashboard Content */}
        <div className="space-y-4 lg:space-y-6">
          {/* Row 1: Quick Stats */}
          <div className="w-full max-w-screen-sm mx-auto sm:max-w-none sm:mx-0 px-3 sm:px-0">
          <DashboardGrid cols={1} gap="md">
            {/* Quick Stats - Takes full width */}
            <div>
              <DashboardCard>
                <div className="space-y-4">
                  <h3 className="text-lg lg:text-xl font-semibold text-slate-900 dark:text-white">Statistik Cepat</h3>
                  <QuickStats items={quickStats} />
                </div>
              </DashboardCard>
            </div>
          </DashboardGrid>
          </div>

          {/* Row 2: Charts & Quick Actions */}
          <div className="w-full max-w-screen-sm mx-auto sm:max-w-none sm:mx-0 px-3 sm:px-0">
          <DashboardGrid cols={3} gap="md">
            {/* Charts Section - Takes 2 columns */}
            <div className="lg:col-span-2">
              <DashboardCard>
                <div className="space-y-4">
                  <h3 className="text-lg lg:text-xl font-semibold text-slate-900 dark:text-white">Analisis Kehadiran</h3>
                  <ChartSummary {...attendanceChartConfig(stats)} />
                </div>
              </DashboardCard>
            </div>
            
            {/* Quick Actions - Takes 1 column */}
            <div>
              <DashboardCard>
                <div className="space-y-4">
                  <h3 className="text-lg lg:text-xl font-semibold text-slate-900 dark:text-white">Aksi Cepat</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 transition-all duration-200">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Tambah Pengguna</span>
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 transition-all duration-200">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Buat Tugas</span>
                      <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 transition-all duration-200">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Upload Dokumen</span>
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </button>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </DashboardGrid>
          </div>
        </div>

        {/* Additional Metrics */}
        <DashboardSection title="Metrik Detail">
          <div className="w-full max-w-screen-sm mx-auto sm:max-w-none sm:mx-0 px-3 sm:px-0">
          <DashboardGrid cols={3} gap="md">
            <DashboardMetricCard
              title="Tugas Selesai"
              value={stats.completedTasks}
              subtitle={`${((stats.completedTasks / stats.totalTasks) * 100).toFixed(1)}% dari total`}
              icon={CheckSquare}
              color="green"
            />
            <DashboardMetricCard
              title="WFH Hari Ini"
              value={stats.todayWFH}
              subtitle={`${((stats.todayWFH / stats.totalUsers) * 100).toFixed(1)}% dari total`}
              icon={Clock}
              color="blue"
            />
            <DashboardMetricCard
              title="Cuti Disetujui"
              value={stats.approvedLeaveRequests}
              subtitle={`${((stats.approvedLeaveRequests / (stats.approvedLeaveRequests + stats.rejectedLeaveRequests + stats.pendingLeaveRequests)) * 100).toFixed(1)}% dari total`}
              icon={Calendar}
              color="purple"
            />
          </DashboardGrid>
          </div>
        </DashboardSection>

        {/* Activity Feed */}
        <DashboardSection title="Aktivitas Terbaru">
          <DashboardCard>
            <div className="space-y-4">
              <ActivityFeed activities={activities || []} />
            </div>
          </DashboardCard>
        </DashboardSection>
      </DashboardLayout>
    </AdminLayout>
  )
}

type MinimalSocket = { on: (event: string, handler: (...args: unknown[]) => void) => void; disconnect: () => void }

