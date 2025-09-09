"use client"

import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  CheckCircle, 
  Search, 
  X, 
  Clock, 
  AlertTriangle, 
  Info, 
  Star, 
  Settings, 
  RefreshCw, 
  BellRing, 
  Check, 
  Trash2, 
  Mail, 
  ExternalLink, 
  Calendar
} from 'lucide-react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

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
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  sender?: string
  actionUrl?: string
  actionText?: string
  important?: boolean
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [notificationSound, setNotificationSound] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(false)
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh notifications
  const refreshNotifications = async () => {
    setIsRefreshing(true)
    await fetchNotifications()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications:updated'))
    }
  }

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser ini tidak mendukung notifikasi desktop')
      return
    }
    
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setDesktopNotifications(true)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationIds: [id] })
      })
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications:updated'))
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications:updated'))
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] })
      })
      
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications:updated'))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const toggleImportant = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, important: !n.important } : n)
    )
  }

  const getNotificationIcon = (notification: Notification) => {
    // First check if there's a type
    if (notification.type) {
      switch (notification.type) {
        case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
        case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
        case 'error': return <X className="h-5 w-5 text-red-500" />
        case 'info': return <Info className="h-5 w-5 text-blue-500" />
      }
    }
    
    // Fallback to title-based icons
    if (notification.title.toLowerCase().includes('tugas')) {
      return <Calendar className="h-5 w-5 text-blue-500" />
    } else if (notification.title.toLowerCase().includes('rapat') || notification.title.toLowerCase().includes('meeting')) {
      return <Calendar className="h-5 w-5 text-purple-500" />
    } else if (notification.title.toLowerCase().includes('deadline')) {
      return <Clock className="h-5 w-5 text-red-500" />
    } else {
      return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
      default: return 'border-slate-200 dark:border-slate-700'
    }
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null
    
    const priorityColors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }
    
    const priorityLabels = {
      low: 'Rendah',
      medium: 'Sedang',
      high: 'Tinggi',
      urgent: 'Urgent'
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[priority as keyof typeof priorityColors]}`}>
        {priorityLabels[priority as keyof typeof priorityLabels]}
      </span>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Baru saja'
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Apply filter
    if (filter === 'unread' && notification.isRead) return false
    if (filter === 'read' && !notification.isRead) return false
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === 'time') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else {
      // Sort by priority
      const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 }
      const aPriority = a.priority ? priorityOrder[a.priority as keyof typeof priorityOrder] : 0
      const bPriority = b.priority ? priorityOrder[b.priority as keyof typeof priorityOrder] : 0
      return bPriority - aPriority
    }
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="h-12 w-12 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary">Notifikasi</h1>
              <p className="text-lg text-text-secondary">
                Kelola semua notifikasi Anda
              </p>
            </div>
          </div>
              
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                <BellRing className="h-4 w-4" />
                <span className="text-sm font-medium">{unreadCount}</span>
              </div>
            </div>
            
            <button
              onClick={refreshNotifications}
              className="px-3 py-2 bg-surface text-text-secondary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 flex items-center space-x-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-accent text-text-inverse rounded-lg hover:bg-accent-hover transition-colors duration-200 flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-surface text-text-secondary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Pengaturan Notifikasi</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bell className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">Suara Notifikasi</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan suara saat notifikasi baru masuk</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setNotificationSound(!notificationSound)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSound ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSound ? 'translate-x-6' : 'translate-x-1'}`}></span>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BellRing className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">Notifikasi Desktop</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tampilkan notifikasi di desktop</p>
                  </div>
                </div>
                
                <button 
                  onClick={requestNotificationPermission}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${desktopNotifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${desktopNotifications ? 'translate-x-6' : 'translate-x-1'}`}></span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'unread' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}
          >
            Belum Dibaca ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'read' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}
          >
            Sudah Dibaca ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-2/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari notifikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                <span>Urutkan berdasarkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'time' | 'priority')}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="time">Waktu</option>
                  <option value="priority">Prioritas</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Bell className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Tidak ada notifikasi
              </h3>
              <p className="text-text-secondary">
                {searchQuery ? 'Coba cari dengan kata kunci yang berbeda' : 'Anda tidak memiliki notifikasi saat ini'}
              </p>
            </div>
          ) : (
            sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border p-6 transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] ${
                  notification.isRead 
                    ? `${getTypeColor(notification.type)} hover:shadow-md` 
                    : `bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-700/60 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/30 hover:shadow-xl hover:ring-2 hover:ring-blue-300/50 dark:hover:ring-blue-700/50`
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-blue-900 dark:text-blue-100'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse shadow-lg ring-2 ring-blue-200 dark:ring-blue-800/50"></span>
                      )}
                      {notification.priority && getPriorityBadge(notification.priority)}
                    </div>
                    
                    <p className={`mb-3 ${
                      notification.isRead ? 'text-slate-600 dark:text-slate-400 opacity-75' : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      {notification.sender && (
                        <span className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{notification.sender}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(notification.createdAt)}</span>
                      </span>
                      
                      {notification.task && (
                        <a 
                          href={`/employee/tasks/${notification.task.id}`}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>{notification.task.title}</span>
                        </a>
                      )}
                      
                      {notification.actionUrl && notification.actionText && (
                        <a 
                          href={notification.actionUrl}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{notification.actionText}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                      title="Tandai sebagai dibaca"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleImportant(notification.id)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      notification.important
                        ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    }`}
                    title={notification.important ? 'Hapus dari penting' : 'Tandai sebagai penting'}
                  >
                    <Star className={`h-4 w-4 ${notification.important ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                    title="Hapus notifikasi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Ringkasan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Total Notifikasi</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Belum Dibaca</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{unreadCount}</p>
                </div>
                <BellRing className="h-8 w-8 text-red-500 dark:text-red-400" />
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Sudah Dibaca</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">{notifications.length - unreadCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}

