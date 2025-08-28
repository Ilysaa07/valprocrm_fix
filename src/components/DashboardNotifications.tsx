'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { Bell, AlertCircle, CheckCircle, Clock, Info, X, CheckSquare, Users, FileText, Home } from 'lucide-react'
import { useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'task' | 'attendance' | 'leave' | 'wfh' | 'user' | 'general'
  isRead: boolean
  createdAt: string
  actionUrl?: string
  actionText?: string
  priority: 'low' | 'medium' | 'high'
}

interface DashboardNotificationsProps {
  title?: string
  notifications: Notification[]
  maxDisplay?: number
  showCategories?: boolean
  showPriority?: boolean
  showActions?: boolean
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
  className?: string
}

export function DashboardNotifications({ 
  title = 'Notifikasi', 
  notifications, 
  maxDisplay = 5,
  showCategories = true,
  showPriority = true,
  showActions = true,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className = '' 
}: DashboardNotificationsProps) {
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set())

  const getNotificationIcon = (type: string) => {
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertCircle,
      error: AlertCircle
    }
    return icons[type as keyof typeof icons] || Bell
  }

  const getNotificationColor = (type: string) => {
    const colors = {
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      system: Info,
      task: CheckSquare,
      attendance: Users,
      leave: FileText,
      wfh: Home,
      user: Users,
      general: Bell
    }
    return icons[category as keyof typeof icons] || Bell
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      system: 'Sistem',
      task: 'Tugas',
      attendance: 'Kehadiran',
      leave: 'Izin',
      wfh: 'WFH',
      user: 'Pengguna',
      general: 'Umum'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      system: 'bg-gray-100 text-gray-800',
      task: 'bg-purple-100 text-purple-800',
      attendance: 'bg-green-100 text-green-800',
      leave: 'bg-blue-100 text-blue-800',
      wfh: 'bg-indigo-100 text-indigo-800',
      user: 'bg-orange-100 text-orange-800',
      general: 'bg-blue-100 text-blue-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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

  const formatTime = (dateString: string) => {
    const now = new Date()
    const notificationTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`
    
    return notificationTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNotifications)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNotifications(newExpanded)
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const displayedNotifications = notifications.slice(0, maxDisplay)

  if (notifications.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Tidak ada notifikasi</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Semua notifikasi sudah dibaca.
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Tandai Semua Dibaca
            </button>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount} belum dibaca
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {displayedNotifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type)
          const CategoryIcon = getCategoryIcon(notification.category)
          const isExpanded = expandedNotifications.has(notification.id)
          
          return (
            <Card key={notification.id} className={`hover:shadow-md transition-shadow ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardBody>
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)} border flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                          {notification.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {showCategories && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)} flex items-center space-x-1`}>
                              <CategoryIcon className="h-3 w-3" />
                              <span>{getCategoryLabel(notification.category)}</span>
                            </span>
                          )}
                          
                          {showPriority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                              {getPriorityLabel(notification.priority)}
                            </span>
                          )}
                          
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {showActions && (
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && onMarkAsRead && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded"
                              title="Tandai sebagai dibaca"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {onDelete && (
                            <button
                              onClick={() => onDelete(notification.id)}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded"
                              title="Hapus notifikasi"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {isExpanded ? notification.message : notification.message.slice(0, 100)}
                      {notification.message.length > 100 && (
                        <button
                          onClick={() => toggleExpanded(notification.id)}
                          className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                        >
                          {isExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}
                        </button>
                      )}
                    </p>
                    
                    {notification.actionUrl && notification.actionText && (
                      <div className="mt-3">
                        <a
                          href={notification.actionUrl}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          {notification.actionText} →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
        
        {notifications.length > maxDisplay && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dan {notifications.length - maxDisplay} notifikasi lainnya
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Predefined notification configurations
export const adminNotifications = (stats: any): Notification[] => {
  const notifications: Notification[] = []
  
  // User registration notifications
  if (stats.pendingUsers > 0) {
    notifications.push({
      id: 'pending-users',
      title: 'Registrasi Karyawan Baru',
      message: `Ada ${stats.pendingUsers} karyawan yang menunggu persetujuan registrasi. Segera review dan approve registrasi karyawan baru.`,
      type: 'warning',
      category: 'user',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/admin/users/pending',
      actionText: 'Lihat Registrasi',
      priority: 'high'
    })
  }
  
  // Leave request notifications
  if (stats.pendingLeaveRequests > 0) {
    notifications.push({
      id: 'leave-requests',
      title: 'Permohonan Izin Pending',
      message: `Ada ${stats.pendingLeaveRequests} permohonan izin yang menunggu persetujuan. Segera proses permohonan izin karyawan.`,
      type: 'warning',
      category: 'leave',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/admin/leave-requests',
      actionText: 'Lihat Permohonan',
      priority: 'medium'
    })
  }
  
  // WFH notifications
  if (stats.pendingWFHLogs > 0) {
    notifications.push({
      id: 'wfh-logs',
      title: 'Log WFH Pending',
      message: `Ada ${stats.pendingWFHLogs} log WFH yang menunggu validasi. Segera validasi log WFH karyawan.`,
      type: 'warning',
      category: 'wfh',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/admin/wfh/validation',
      actionText: 'Lihat Log WFH',
      priority: 'medium'
    })
  }
  
  // Attendance notifications
  if (stats.todayPresent === 0 && stats.totalUsers > 0) {
    notifications.push({
      id: 'no-attendance',
      title: 'Tidak Ada Kehadiran',
      message: 'Belum ada karyawan yang melakukan absensi hari ini. Periksa sistem absensi.',
      type: 'error',
      category: 'attendance',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/admin/attendance',
      actionText: 'Periksa Absensi',
      priority: 'high'
    })
  }
  
  return notifications
}

export const employeeNotifications = (stats: any): Notification[] => {
  const notifications: Notification[] = []
  
  // Task notifications
  if (stats.totalTasks === 0) {
    notifications.push({
      id: 'no-tasks',
      title: 'Belum Ada Tugas',
      message: 'Anda belum memiliki tugas yang diberikan. Hubungi supervisor untuk mendapatkan tugas.',
      type: 'info',
      category: 'task',
      isRead: false,
      createdAt: new Date().toISOString(),
      priority: 'low'
    })
  }
  
  // Leave request notifications
  if (stats.pendingLeaveRequests > 0) {
    notifications.push({
      id: 'leave-pending',
      title: 'Permohonan Izin Pending',
      message: `Anda memiliki ${stats.pendingLeaveRequests} permohonan izin yang menunggu persetujuan. Pantau status permohonan izin Anda.`,
      type: 'warning',
      category: 'leave',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/employee/leave-requests',
      actionText: 'Lihat Status',
      priority: 'medium'
    })
  }
  
  // WFH notifications
  if (stats.pendingWFHLogs > 0) {
    notifications.push({
      id: 'wfh-pending',
      title: 'Log WFH Pending',
      message: `Anda memiliki ${stats.pendingWFHLogs} log WFH yang menunggu validasi. Pantau status validasi WFH Anda.`,
      type: 'warning',
      category: 'wfh',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/employee/wfh',
      actionText: 'Lihat Status',
      priority: 'medium'
    })
  }
  
  // Notification count notifications
  if (stats.unreadNotifications > 5) {
    notifications.push({
      id: 'many-notifications',
      title: 'Banyak Notifikasi Belum Dibaca',
      message: `Anda memiliki ${stats.unreadNotifications} notifikasi yang belum dibaca. Segera baca notifikasi penting.`,
      type: 'warning',
      category: 'general',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/employee/notifications',
      actionText: 'Baca Notifikasi',
      priority: 'medium'
    })
  }
  
  return notifications
}
