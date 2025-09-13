'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'

export interface Notification {
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

interface NotificationsSummaryProps {
  notifications: Notification[]
  maxItems?: number
  showMarkAsRead?: boolean
  title?: string
  className?: string
}

export function NotificationsSummary({ 
  notifications, 
  maxItems = 5, 
  showMarkAsRead = false,
  title,
  className = '' 
}: NotificationsSummaryProps) {
  const displayNotifications = notifications.slice(0, maxItems)
  const unreadCount = notifications.filter(n => !n.isRead).length
  
  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Baru saja'
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  if (displayNotifications.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {title}
            </h3>
          )}
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada notifikasi
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardBody>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} baru
                </span>
              )}
              <Link
                href="/admin/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Lihat Semua
              </Link>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-colors ${
                notification.isRead 
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' 
                  : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.isRead ? 'bg-gray-400' : 'bg-blue-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                      {notification.type === 'success' && 'Sukses'}
                      {notification.type === 'warning' && 'Peringatan'}
                      {notification.type === 'error' && 'Error'}
                      {notification.type === 'info' && 'Info'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority === 'high' && 'Tinggi'}
                      {notification.priority === 'medium' && 'Sedang'}
                      {notification.priority === 'low' && 'Rendah'}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {notification.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      {notification.actionUrl && notification.actionText && (
                        <Link
                          href={notification.actionUrl}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {notification.actionText}
                        </Link>
                      )}
                      {showMarkAsRead && !notification.isRead && (
                        <button
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => { /* TODO: mark as read */ }}
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
