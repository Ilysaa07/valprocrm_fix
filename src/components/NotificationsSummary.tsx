'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { Bell, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface NotificationSummary {
  unreadCount: number
  totalCount?: number
  recentNotifications?: Array<{
    id: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
  }>
}

interface NotificationsSummaryProps {
  notifications: NotificationSummary
  title?: string
  viewAllHref?: string
  showRecent?: boolean
  maxRecent?: number
  className?: string
}

export function NotificationsSummary({ 
  notifications, 
  title = 'Notifikasi', 
  viewAllHref, 
  showRecent = false,
  maxRecent = 3,
  className = '' 
}: NotificationsSummaryProps) {
  const getNotificationIcon = () => {
    if (notifications.unreadCount === 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (notifications.unreadCount <= 5) {
      return <Bell className="h-5 w-5 text-blue-600" />
    } else {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getNotificationColor = () => {
    if (notifications.unreadCount === 0) {
      return 'bg-green-50 border-green-200'
    } else if (notifications.unreadCount <= 5) {
      return 'bg-blue-50 border-blue-200'
    } else {
      return 'bg-red-50 border-red-200'
    }
  }

  const formatTime = (dateString: string) => {
    const now = new Date()
    const notificationTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`
    return notificationTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <Card className={className}>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {viewAllHref && (
            <Link 
              href={viewAllHref} 
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            >
              Lihat Semua
            </Link>
          )}
        </div>
        
        {/* Main notification summary */}
        <div className={`flex items-center p-3 rounded-lg border ${getNotificationColor()}`}>
          {getNotificationIcon()}
          <div className="ml-3">
            <p className="font-medium text-gray-900">
              {notifications.unreadCount === 0 
                ? 'Semua notifikasi sudah dibaca' 
                : `${notifications.unreadCount} notifikasi belum dibaca`
              }
            </p>
            <p className="text-sm text-gray-600">
              {notifications.unreadCount === 0 
                ? 'Anda sudah membaca semua notifikasi'
                : 'Klik untuk melihat detail notifikasi'
              }
            </p>
          </div>
        </div>

        {/* Recent notifications */}
        {showRecent && notifications.recentNotifications && notifications.recentNotifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notifikasi Terbaru</h4>
            <div className="space-y-2">
              {notifications.recentNotifications.slice(0, maxRecent).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-2 rounded-lg text-sm ${
                    notification.isRead 
                      ? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-blue-900 dark:text-blue-100'}`}>
                        {notification.title}
                      </p>
                      <p className={`mt-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-blue-700 dark:text-blue-200'}`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center ml-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      )}
                      <span className={`text-xs ${notification.isRead ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-300'}`}>
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        {notifications.unreadCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Tandai Semua Dibaca
              </button>
              {viewAllHref && (
                <Link 
                  href={viewAllHref}
                  className="flex-1 px-3 py-2 text-sm font-medium text-center text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  Lihat Semua
                </Link>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
