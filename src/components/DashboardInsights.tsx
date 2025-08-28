'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Clock, Users, CheckSquare } from 'lucide-react'

interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'info'
  title: string
  description: string
  action?: string
  actionHref?: string
  icon?: React.ComponentType<{ className?: string }>
  priority: 'high' | 'medium' | 'low'
  category: 'performance' | 'attendance' | 'tasks' | 'users' | 'system' | 'general'
}

interface DashboardInsightsProps {
  title?: string
  insights: Insight[]
  maxDisplay?: number
  showCategories?: boolean
  showPriority?: boolean
  className?: string
}

export function DashboardInsights({ 
  title = 'Insights & Rekomendasi', 
  insights, 
  maxDisplay = 5,
  showCategories = true,
  showPriority = true,
  className = '' 
}: DashboardInsightsProps) {
  const getInsightIcon = (type: string) => {
    const icons = {
      positive: TrendingUp,
      negative: TrendingDown,
      neutral: Info,
      warning: AlertTriangle,
      info: Info
    }
    return icons[type as keyof typeof icons] || Info
  }

  const getInsightColor = (type: string) => {
    const colors = {
      positive: 'text-green-600 bg-green-50 border-green-200',
      negative: 'text-red-600 bg-red-50 border-red-200',
      neutral: 'text-blue-600 bg-blue-50 border-blue-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      info: 'text-purple-600 bg-purple-50 border-purple-200'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      performance: TrendingUp,
      attendance: Users,
      tasks: CheckSquare,
      users: Users,
      system: Info,
      general: Lightbulb
    }
    return icons[category as keyof typeof icons] || Info
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      performance: 'Performa',
      attendance: 'Kehadiran',
      tasks: 'Tugas',
      users: 'Pengguna',
      system: 'Sistem',
      general: 'Umum'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      performance: 'bg-blue-100 text-blue-800',
      attendance: 'bg-green-100 text-green-800',
      tasks: 'bg-purple-100 text-purple-800',
      users: 'bg-orange-100 text-orange-800',
      system: 'bg-gray-100 text-gray-800',
      general: 'bg-indigo-100 text-indigo-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  const displayedInsights = sortedInsights.slice(0, maxDisplay)

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Tidak ada insights</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Semua sistem berjalan dengan baik.
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      )}
      
      <div className="space-y-4">
        {displayedInsights.map((insight) => {
          const Icon = insight.icon || getInsightIcon(insight.type)
          const CategoryIcon = getCategoryIcon(insight.category)
          
          return (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)} border flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {insight.title}
                      </h4>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        {showPriority && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(insight.priority)}`}>
                            {getPriorityLabel(insight.priority)}
                          </span>
                        )}
                        
                        {showCategories && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(insight.category)} flex items-center space-x-1`}>
                            <CategoryIcon className="h-3 w-3" />
                            <span>{getCategoryLabel(insight.category)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {insight.description}
                    </p>
                    
                    {insight.action && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Rekomendasi: {insight.action}
                        </span>
                        
                        {insight.actionHref && (
                          <a 
                            href={insight.actionHref}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Lihat Detail →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
        
        {insights.length > maxDisplay && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dan {insights.length - maxDisplay} insight lainnya
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Predefined insight configurations
export const adminInsights = (stats: any) => {
  const insights: Insight[] = []
  
  // User registration insights
  if (stats.pendingUsers > 0) {
    insights.push({
      id: 'pending-users',
      type: 'warning',
      title: 'Registrasi Karyawan Pending',
      description: `Ada ${stats.pendingUsers} karyawan yang menunggu persetujuan registrasi.`,
      action: 'Segera review dan approve registrasi karyawan baru',
      actionHref: '/admin/users/pending',
      priority: 'high',
      category: 'users'
    })
  }
  
  // Attendance insights
  if (stats.todayPresent === 0 && stats.totalUsers > 0) {
    insights.push({
      id: 'no-attendance',
      type: 'negative',
      title: 'Tidak Ada Kehadiran Hari Ini',
      description: 'Belum ada karyawan yang melakukan absensi hari ini.',
      action: 'Periksa sistem absensi dan berikan pengumuman',
      priority: 'high',
      category: 'attendance'
    })
  } else if (stats.todayPresent > 0 && stats.todayPresent < stats.totalUsers * 0.5) {
    insights.push({
      id: 'low-attendance',
      type: 'warning',
      title: 'Kehadiran Rendah',
      description: `Hanya ${stats.todayPresent} dari ${stats.totalUsers} karyawan yang hadir hari ini.`,
      action: 'Periksa alasan ketidakhadiran karyawan',
      priority: 'medium',
      category: 'attendance'
    })
  }
  
  // Task insights
  if (stats.completedTasks > 0 && stats.completedTasks / stats.totalTasks > 0.8) {
    insights.push({
      id: 'high-task-completion',
      type: 'positive',
      title: 'Tingkat Penyelesaian Tugas Tinggi',
      description: `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% tugas telah selesai.`,
      action: 'Berikan apresiasi kepada tim',
      priority: 'low',
      category: 'tasks'
    })
  }
  
  // Leave request insights
  if (stats.pendingLeaveRequests > 5) {
    insights.push({
      id: 'many-leave-requests',
      type: 'warning',
      title: 'Banyak Permohonan Izin Pending',
      description: `Ada ${stats.pendingLeaveRequests} permohonan izin yang menunggu persetujuan.`,
      action: 'Segera proses permohonan izin karyawan',
      actionHref: '/admin/leave-requests',
      priority: 'medium',
      category: 'attendance'
    })
  }
  
  // WFH insights
  if (stats.pendingWFHLogs > 3) {
    insights.push({
      id: 'many-wfh-logs',
      type: 'warning',
      title: 'Banyak Log WFH Pending',
      description: `Ada ${stats.pendingWFHLogs} log WFH yang menunggu validasi.`,
      action: 'Segera validasi log WFH karyawan',
      actionHref: '/admin/wfh/validation',
      priority: 'medium',
      category: 'attendance'
    })
  }
  
  // System performance insights
  if (stats.totalUsers > 0) {
    const attendanceRate = (stats.todayPresent + stats.todayWFH) / stats.totalUsers
    if (attendanceRate > 0.9) {
      insights.push({
        id: 'excellent-attendance',
        type: 'positive',
        title: 'Kehadiran Sangat Baik',
        description: `${Math.round(attendanceRate * 100)}% karyawan hadir atau WFH hari ini.`,
        action: 'Pertahankan budaya kerja yang baik',
        priority: 'low',
        category: 'performance'
      })
    }
  }
  
  return insights
}

export const employeeInsights = (stats: any) => {
  const insights: Insight[] = []
  
  // Task insights
  if (stats.totalTasks === 0) {
    insights.push({
      id: 'no-tasks',
      type: 'info',
      title: 'Belum Ada Tugas',
      description: 'Anda belum memiliki tugas yang diberikan.',
      action: 'Hubungi supervisor untuk mendapatkan tugas',
      priority: 'medium',
      category: 'tasks'
    })
  } else if (stats.completedTasks > 0 && stats.completedTasks / stats.totalTasks > 0.8) {
    insights.push({
      id: 'high-productivity',
      type: 'positive',
      title: 'Produktivitas Tinggi',
      description: `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% tugas telah selesai.`,
      action: 'Pertahankan kinerja yang baik',
      priority: 'low',
      category: 'performance'
    })
  }
  
  // Leave request insights
  if (stats.pendingLeaveRequests > 0) {
    insights.push({
      id: 'leave-pending',
      type: 'warning',
      title: 'Permohonan Izin Pending',
      description: `Anda memiliki ${stats.pendingLeaveRequests} permohonan izin yang menunggu persetujuan.`,
      action: 'Pantau status permohonan izin Anda',
      actionHref: '/employee/leave-requests',
      priority: 'medium',
      category: 'attendance'
    })
  }
  
  // WFH insights
  if (stats.pendingWFHLogs > 0) {
    insights.push({
      id: 'wfh-pending',
      type: 'warning',
      title: 'Log WFH Pending',
      description: `Anda memiliki ${stats.pendingWFHLogs} log WFH yang menunggu validasi.`,
      action: 'Pantau status validasi WFH Anda',
      actionHref: '/employee/wfh',
      priority: 'medium',
      category: 'attendance'
    })
  }
  
  // Notification insights
  if (stats.unreadNotifications > 5) {
    insights.push({
      id: 'many-notifications',
      type: 'warning',
      title: 'Banyak Notifikasi Belum Dibaca',
      description: `Anda memiliki ${stats.unreadNotifications} notifikasi yang belum dibaca.`,
      action: 'Segera baca notifikasi penting',
      actionHref: '/employee/notifications',
      priority: 'medium',
      category: 'general'
    })
  }
  
  return insights
}
