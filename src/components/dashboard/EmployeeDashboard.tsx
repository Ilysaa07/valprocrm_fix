'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  UserCheck, 
  Bell, 
  TrendingUp,
  FileText,
  Home,
  Plus,
  Eye,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Target,
  Award,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'

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

interface EmployeeDashboardProps {
  stats: EmployeeStats | null
  recentTasks: Task[]
  notifications: Notification[]
  isLoading: boolean
  onRefresh: () => void
}

export default function EmployeeDashboard({
  stats,
  recentTasks,
  notifications,
  isLoading,
  onRefresh
}: EmployeeDashboardProps) {
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success text-success-dark'
      case 'IN_PROGRESS': return 'bg-accent text-accent-dark'
      case 'PENDING_VALIDATION': return 'bg-warning text-warning-dark'
      case 'REVISION': return 'bg-error text-error-dark'
      case 'NOT_STARTED': return 'bg-text-muted text-text-inverse'
      default: return 'bg-text-muted text-text-inverse'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Selesai'
      case 'IN_PROGRESS': return 'Sedang Dikerjakan'
      case 'PENDING_VALIDATION': return 'Menunggu Validasi'
      case 'REVISION': return 'Revisi'
      case 'NOT_STARTED': return 'Belum Dimulai'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-error'
      case 'HIGH': return 'text-warning'
      case 'MEDIUM': return 'text-accent'
      case 'LOW': return 'text-text-muted'
      default: return 'text-text-muted'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="text-text-secondary">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-error mx-auto" />
          <h3 className="text-lg font-semibold text-text-primary">Gagal memuat data</h3>
          <p className="text-text-secondary">Terjadi kesalahan saat memuat data dashboard</p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  const taskCompletionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0

  return (
      <div className="space-y-6 min-w-0 overflow-x-hidden" role="main" aria-label="Employee Dashboard">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-4 sm:p-6 border border-accent/20 theme-transition" role="banner">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-text-primary truncate" id="welcome-title">
                Selamat datang, {session?.user?.name || 'Karyawan'}! 👋
              </h1>
            <p className="text-text-secondary mt-1 text-sm sm:text-base">
              {currentTime.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-text-muted text-xs sm:text-sm">
              {currentTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-accent">
              {stats.todayPresent ? '✅' : '⏰'}
            </div>
            <p className="text-xs sm:text-sm text-text-secondary">
              {stats.todayPresent ? 'Sudah hadir' : 'Belum hadir'}
            </p>
            {stats.checkInTime && (
              <p className="text-[11px] sm:text-xs text-text-muted">
                Check-in: {formatTime(stats.checkInTime)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full px-3 sm:px-0 min-w-0" role="region" aria-label="Key Metrics">
        {/* Total Tasks */}
        <Card className="hover:shadow-lg transition-shadow duration-200 dashboard-card">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Tugas</p>
                <p className="text-3xl font-bold text-text-primary">{stats.totalTasks}</p>
                <p className="text-xs text-text-muted">Tugas yang diberikan</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl">
                <CheckSquare className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Completed Tasks */}
        <Card className="hover:shadow-lg transition-shadow duration-200 dashboard-card">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Selesai</p>
                <p className="text-3xl font-bold text-success">{stats.completedTasks}</p>
                <p className="text-xs text-text-muted">
                  {taskCompletionRate.toFixed(1)}% dari total
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pending Tasks */}
        <Card className="hover:shadow-lg transition-shadow duration-200 dashboard-card">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Aktif</p>
                <p className="text-3xl font-bold text-warning">{stats.pendingTasks}</p>
                <p className="text-xs text-text-muted">Sedang dikerjakan</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card className="hover:shadow-lg transition-shadow duration-200 dashboard-card">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Notifikasi</p>
                <p className="text-3xl font-bold text-accent">{stats.unreadNotifications}</p>
                <p className="text-xs text-text-muted">Belum dibaca</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl">
                <Bell className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full px-3 sm:px-0 min-w-0" role="region" aria-label="Main Content">
        {/* Recent Tasks - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="dashboard-card theme-transition">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Tugas Terbaru</h2>
                <Link href="/employee/tasks">
                  <Button variant="outline" size="sm" className="hidden xs:inline-flex">
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </div>
            <CardBody className="pt-0">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">Belum ada tugas</p>
                  <p className="text-sm text-text-muted">Tugas yang diberikan akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-card rounded-xl border border-border hover:bg-card-hover transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                          <h3 className="text-sm font-medium text-text-primary truncate">
                            {task.title}
                          </h3>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-text-muted">
                            Deadline: {formatDate(task.deadline)}
                          </span>
                        </div>
                        {task.status === 'REVISION' && task.validationMessage && (
                          <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded-lg">
                            <p className="text-xs text-error">
                              <strong>Feedback:</strong> {task.validationMessage}
                            </p>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-muted flex-shrink-0 ml-2 hidden sm:block" />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions & Notifications - Takes 1 column */}
        <div className="space-y-6">
          {/* Recent Notifications */}
          <Card className="dashboard-card theme-transition">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Notifikasi</h2>
                <Link href="/employee/notifications">
                  <Button variant="outline" size="sm" className="hidden xs:inline-flex">
                    <Eye className="h-4 w-4 mr-2" />
                    Semua
                  </Button>
                </Link>
              </div>
            </div>
            <CardBody className="pt-0">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Tidak ada notifikasi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border ${
                      notification.isRead 
                        ? 'bg-card border-border' 
                        : 'bg-accent/5 border-accent/20'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.isRead ? 'bg-text-muted' : 'bg-accent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-text-primary">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Progress Overview */}
      <Card role="region" aria-label="Progress Overview" className="dashboard-card theme-transition">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-semibold text-text-primary">Progress Tugas</h2>
        </div>
        <CardBody className="pt-0">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Tugas Selesai</span>
                <span className="text-sm text-text-secondary">
                  {stats.completedTasks} dari {stats.totalTasks}
                </span>
              </div>
              <ProgressBar 
                progress={taskCompletionRate} 
                className="h-2"
                variant="success"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{stats.completedTasks}</p>
                <p className="text-sm text-text-secondary">Selesai</p>
              </div>
              <div className="text-center p-4 bg-warning/5 rounded-lg">
                <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{stats.pendingTasks}</p>
                <p className="text-sm text-text-secondary">Aktif</p>
              </div>
              <div className="text-center p-4 bg-error/5 rounded-lg">
                <XCircle className="h-8 w-8 text-error mx-auto mb-2" />
                <p className="text-2xl font-bold text-error">{stats.revisionTasks || 0}</p>
                <p className="text-sm text-text-secondary">Revisi</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Additional Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full px-3 sm:px-0 min-w-0">
        {/* Leave & WFH Status */}
        <Card className="dashboard-card theme-transition">
          <div className="p-6 pb-4">
            <h2 className="text-xl font-semibold text-text-primary">Status Izin & WFH</h2>
          </div>
          <CardBody className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Izin Pending</p>
                    <p className="text-xs text-text-secondary">Menunggu persetujuan</p>
                  </div>
                </div>
                <Badge className="bg-warning text-warning-dark">
                  {stats.pendingLeaveRequests || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Home className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">WFH Pending</p>
                    <p className="text-xs text-text-secondary">Menunggu persetujuan</p>
                  </div>
                </div>
                <Badge className="bg-warning text-warning-dark">
                  {stats.pendingWFHLogs || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Izin Disetujui</p>
                    <p className="text-xs text-text-secondary">Bulan ini</p>
                  </div>
                </div>
                <Badge className="bg-success text-success-dark">
                  {stats.approvedLeaveRequests || 0}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Stats Summary */}
        <Card className="dashboard-card theme-transition">
          <div className="p-6 pb-4">
            <h2 className="text-xl font-semibold text-text-primary">Ringkasan Cepat</h2>
          </div>
          <CardBody className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-accent mx-auto mb-2" />
                  <p className="text-lg font-bold text-accent">{taskCompletionRate.toFixed(1)}%</p>
                  <p className="text-xs text-text-secondary">Efisiensi</p>
                </div>
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-success mx-auto mb-2" />
                  <p className="text-lg font-bold text-success">{stats.totalTasks}</p>
                  <p className="text-xs text-text-secondary">Total Tugas</p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Tugas Selesai</span>
                  <span className="font-medium text-text-primary">{stats.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-text-secondary">Tugas Aktif</span>
                  <span className="font-medium text-text-primary">{stats.pendingTasks}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-text-secondary">Perlu Revisi</span>
                  <span className="font-medium text-text-primary">{stats.revisionTasks || 0}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="dashboard-card theme-transition">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Aktivitas Terbaru</h2>
            <Link href="/employee/notifications">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Semua
              </Button>
            </Link>
          </div>
        </div>
        <CardBody className="pt-0">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">Tidak ada aktivitas terbaru</p>
              <p className="text-sm text-text-muted">Aktivitas akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className={`p-4 rounded-lg border ${
                  notification.isRead 
                    ? 'bg-card border-border' 
                    : 'bg-accent/5 border-accent/20'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.isRead ? 'bg-text-muted' : 'bg-accent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Additional Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0 px-3 sm:px-0">

        {/* Productivity Tips */}
        <Card className="dashboard-card theme-transition">
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-semibold text-text-primary">Tips Produktivitas</h2>
            </div>
          </div>
          <CardBody className="pt-0">
            <div className="space-y-4">
              <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Fokus pada 1 tugas
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Selesaikan tugas yang paling penting terlebih dahulu
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="flex items-start space-x-3">
                  <Award className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Istirahat teratur
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ambil istirahat 5-10 menit setiap jam
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-start space-x-3">
                  <CheckSquare className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Update progress
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Update status tugas secara berkala
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions Extended */}
        <Card className="dashboard-card theme-transition">
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-text-primary">Aksi Cepat</h2>
            </div>
          </div>
          <CardBody className="pt-0">
            <div className="space-y-3">
              <Link href="/employee/tasks">
                <Button className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat Semua Tugas
                </Button>
              </Link>
              
              <Link href="/employee/attendance">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Absensi Hari Ini
                </Button>
              </Link>
              
              <Link href="/employee/leave-requests">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ajukan Izin
                </Button>
              </Link>
              
              <Link href="/employee/wfh-logs">
                <Button variant="outline" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Log WFH
                </Button>
              </Link>
              
              <div className="pt-2 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-2">Performa hari ini</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-medium text-text-primary">Sangat Baik</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
