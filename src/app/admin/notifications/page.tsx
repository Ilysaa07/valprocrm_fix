'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CheckSquare,
  User,
  Filter
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  task?: {
    id: string
    title: string
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filter === 'UNREAD') {
        params.append('unread', 'true')
      }
      
      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications)
      } else {
        console.error('Error fetching notifications:', data.error)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds
        }),
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_all_read'
        }),
      })

      if (response.ok) {
        fetchNotifications()
        alert('Semua notifikasi telah ditandai sebagai dibaca')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (title: string) => {
    if (title.includes('Tugas Baru') || title.includes('Tugas')) {
      return <CheckSquare className="h-5 w-5 text-blue-500" />
    } else if (title.includes('Registrasi')) {
      return <User className="h-5 w-5 text-green-500" />
    } else if (title.includes('Status')) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
    return <Bell className="h-5 w-5 text-gray-500" />
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'UNREAD') return !notification.isRead
    if (filter === 'READ') return notification.isRead
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Semua</option>
                  <option value="UNREAD">Belum Dibaca</option>
                  <option value="READ">Sudah Dibaca</option>
                </select>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Tandai Semua Dibaca
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {filter === 'UNREAD' ? 'Tidak ada notifikasi belum dibaca' : 'Tidak ada notifikasi'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'UNREAD' 
                  ? 'Semua notifikasi sudah dibaca.'
                  : 'Notifikasi akan muncul di sini ketika ada aktivitas baru.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.title)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`mt-1 text-sm ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {notification.task && (
                            <div className="mt-2">
                              <a
                                href="/admin/tasks"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Lihat Tugas: {notification.task.title}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString('id-ID')}
                          </div>
                          
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead([notification.id])}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Tandai sebagai dibaca"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Notifikasi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                <div className="text-sm text-blue-700">Total Notifikasi</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
                <div className="text-sm text-red-700">Belum Dibaca</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.length - unreadCount}
                </div>
                <div className="text-sm text-green-700">Sudah Dibaca</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}