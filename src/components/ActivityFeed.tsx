'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { Activity, User, CheckCircle, Clock, AlertCircle, FileText, Home, MapPin } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'user_registration' | 'task_completed' | 'attendance' | 'leave_request' | 'wfh_log' | 'notification'
  title: string
  description: string
  timestamp: string
  user?: string
  status?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  title?: string
  maxItems?: number
  showUser?: boolean
  className?: string
}

export function ActivityFeed({ 
  activities, 
  title = 'Aktivitas Terbaru', 
  maxItems = 5,
  showUser = true,
  className = '' 
}: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    const icons = {
      user_registration: User,
      task_completed: CheckCircle,
      attendance: MapPin,
      leave_request: FileText,
      wfh_log: Home,
      notification: AlertCircle
    }
    
    return icons[type as keyof typeof icons] || Activity
  }

  const getActivityColor = (type: string) => {
    const colors = {
      user_registration: 'text-blue-600 bg-blue-100',
      task_completed: 'text-green-600 bg-green-100',
      attendance: 'text-purple-600 bg-purple-100',
      leave_request: 'text-yellow-600 bg-yellow-100',
      wfh_log: 'text-indigo-600 bg-indigo-100',
      notification: 'text-red-600 bg-red-100'
    }
    
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`
    
    return activityTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800'
    }
    
    const labels = {
      PENDING: 'Pending',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
      COMPLETED: 'Selesai',
      IN_PROGRESS: 'Dalam Progress'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <Card className={className}>
      <CardBody>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Belum ada aktivitas</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aktivitas akan muncul di sini saat ada perubahan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, maxItems).map((activity) => {
              const Icon = activity.icon || getActivityIcon(activity.type)
              const iconColor = getActivityColor(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className={`p-2 rounded-lg ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                        
                        {showUser && activity.user && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            oleh {activity.user}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        {getStatusBadge(activity.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {activities.length > maxItems && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dan {activities.length - maxItems} aktivitas lainnya
                </p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// Predefined activity configurations
export const adminActivityFeed = (stats: any) => [
  {
    id: '1',
    type: 'user_registration' as const,
    title: 'Registrasi Karyawan Baru',
    description: `${stats.pendingUsers || 0} karyawan menunggu persetujuan registrasi`,
    timestamp: new Date().toISOString(),
    status: stats.pendingUsers > 0 ? 'PENDING' : 'COMPLETED'
  },
  {
    id: '2',
    type: 'attendance' as const,
    title: 'Kehadiran Hari Ini',
    description: `${stats.todayPresent || 0} karyawan hadir, ${stats.todayWFH || 0} WFH, ${stats.todayAbsent || 0} tidak hadir`,
    timestamp: new Date().toISOString(),
    status: 'COMPLETED'
  },
  {
    id: '3',
    type: 'leave_request' as const,
    title: 'Permohonan Izin',
    description: `${stats.pendingLeaveRequests || 0} permohonan izin menunggu persetujuan`,
    timestamp: new Date().toISOString(),
    status: stats.pendingLeaveRequests > 0 ? 'PENDING' : 'COMPLETED'
  },
  {
    id: '4',
    type: 'wfh_log' as const,
    title: 'Log WFH',
    description: `${stats.pendingWFHLogs || 0} log WFH menunggu validasi`,
    timestamp: new Date().toISOString(),
    status: stats.pendingWFHLogs > 0 ? 'PENDING' : 'COMPLETED'
  }
]

export const employeeActivityFeed = (stats: any) => [
  {
    id: '1',
    type: 'task_completed' as const,
    title: 'Progress Tugas',
    description: `${stats.completedTasks || 0} tugas selesai dari ${stats.totalTasks || 0} total`,
    timestamp: new Date().toISOString(),
    status: stats.totalTasks > 0 ? 'IN_PROGRESS' : 'COMPLETED'
  },
  {
    id: '2',
    type: 'leave_request' as const,
    title: 'Status Izin',
    description: `${stats.pendingLeaveRequests || 0} izin pending, ${stats.approvedLeaveRequests || 0} disetujui`,
    timestamp: new Date().toISOString(),
    status: stats.pendingLeaveRequests > 0 ? 'PENDING' : 'COMPLETED'
  },
  {
    id: '3',
    type: 'wfh_log' as const,
    title: 'Status WFH',
    description: `${stats.pendingWFHLogs || 0} log WFH pending validasi`,
    timestamp: new Date().toISOString(),
    status: stats.pendingWFHLogs > 0 ? 'PENDING' : 'COMPLETED'
  },
  {
    id: '4',
    type: 'notification' as const,
    title: 'Notifikasi',
    description: `${stats.unreadNotifications || 0} notifikasi belum dibaca`,
    timestamp: new Date().toISOString(),
    status: stats.unreadNotifications > 0 ? 'PENDING' : 'COMPLETED'
  }
]
