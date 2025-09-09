'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Bell, Volume2, VolumeX, Check, Trash2, Settings, ExternalLink, BellRing, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useToast } from './providers/ToastProvider'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
// import { AttendanceNotification } from '@/lib/socket'

interface NotificationItem {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  taskId?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, unknown>
}

export default function NotificationDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const bellRef = useRef<HTMLButtonElement | null>(null)
  const prevUnreadRef = useRef<number>(0)
  const seenIdsRef = useRef<Set<string>>(new Set()) // NEW: untuk anti-duplicate
  const pollingRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { showToast } = useToast()
  const socketRef = useRef<Socket | null>(null)

  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

  const fetchNotifications = useCallback(async (opts?: { limit?: number }) => {
    setLoading(true)
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (opts?.limit) params.append('limit', String(opts.limit))

      const res = await fetch(`/api/notifications?${params.toString()}`)
      if (!res.ok) throw new Error('Fetch failed')

      const data = await res.json()
      setNotifications(data.notifications || [])

      const unread = data.unreadCount ?? (data.notifications?.filter((n: NotificationItem) => !n.isRead).length ?? 0)
      setUnreadCount(unread)
      prevUnreadRef.current = unread
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const fetchUnreadAndNotify = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unread=true')
      if (!res.ok) return

      const data = await res.json()
      const newUnread = data.notifications?.length ?? 0

      if (newUnread > prevUnreadRef.current) {
        const newCount = newUnread - prevUnreadRef.current
        const latest = data.notifications?.[0]

        if (newCount === 1 && latest && !seenIdsRef.current.has(latest.id)) {
          showToast(latest.message, { title: latest.title, type: 'info', duration: 5000, idKey: latest.id })
          seenIdsRef.current.add(latest.id)
        } else if (newCount > 1) {
          const batchId = `multi-${Date.now()}`
          showToast(`Anda memiliki ${newCount} notifikasi baru`, { title: 'Notifikasi Baru', type: 'info', duration: 5000, idKey: batchId })
          data.notifications?.forEach((n: NotificationItem) => seenIdsRef.current.add(n.id))
        }

        if (soundEnabled && audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(() => {})
        }

        if (!isDev && notificationSupported && notificationPermission === 'granted' && latest) {
          try {
            new Notification(latest.title || 'Notifikasi Baru', {
              body: latest.message,
              icon: '/logometa.png',
              tag: 'notification-' + latest.id,
              requireInteraction: false,
              silent: false,
              data: {
                url: '/admin/notifications',
                id: latest.id
              }
            })
          } catch {}
        } else {
          new Notification(latest.title || 'Notifikasi Baru', { body: latest.message, icon: '/logometa.png' })
        }
      }

      setUnreadCount(newUnread)
      prevUnreadRef.current = newUnread
    } catch {}
  }, [notificationPermission, showToast, soundEnabled, notificationSupported, isDev])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setMounted(true)

    audioRef.current = new Audio('/notification.mp3')
    audioRef.current.preload = 'auto'
    audioRef.current.volume = 0.4

    const saved = localStorage.getItem('notificationSoundEnabled')
    if (saved !== null) setSoundEnabled(saved === 'true')

    if (notificationSupported) setNotificationPermission(Notification.permission)

    fetchNotifications({ limit: 5 })

    // Listen custom events from pages to refresh dropdown
    const onUpdated = () => fetchNotifications({ limit: 10 })
    window.addEventListener('notifications:updated', onUpdated)

    pollingRef.current = window.setInterval(() => {
      fetchUnreadAndNotify()
    }, 30000)

    // Socket realtime notifications (reuse global socket if exists)
    try {
      const globalSocket = (window as unknown as { socket?: Socket }).socket
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const s =
        globalSocket ||
        io(baseUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          withCredentials: true,
        })
      socketRef.current = s
      s.on('notification', (payload: { title: string; message: string; conversationId?: string }) => {
        setUnreadCount((prev) => prev + 1)
        prevUnreadRef.current = prevUnreadRef.current + 1
        showToast(payload.message, { title: payload.title, type: 'info', duration: 5000, idKey: `sock-${Date.now()}` })
        if (soundEnabled && audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(() => {})
        }

        if (!isDev && notificationSupported && notificationPermission === 'granted') {
          try {
            const url = payload.conversationId ? `/chat?c=${payload.conversationId}` : '/admin/notifications'
            new Notification(payload.title || 'Notifikasi Baru', {
              body: payload.message,
              icon: '/logometa.png',
              badge: '/logometa.png',
              tag: `chat-${payload.conversationId || Date.now()}`,
              data: { url }
            })
          } catch {}
        } else {
          new Notification(payload.title || 'Notifikasi Baru', { body: payload.message, icon: '/logometa.png' })
        }
      })

      // Remove attendance-related socket listeners
    } catch {}

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (socketRef.current && !(window as unknown as { socket?: Socket }).socket) socketRef.current.disconnect()
      window.removeEventListener('notifications:updated', onUpdated)
    }
  }, [fetchNotifications, fetchUnreadAndNotify, notificationSupported, isDev, notificationPermission, showToast, soundEnabled])

  const toggleDropdown = async () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    if (newOpen) await fetchNotifications({ limit: 10 })
  }

  const requestNotificationPermission = async () => {
    if (!notificationSupported) return
    try {
      const p = await Notification.requestPermission()
      setNotificationPermission(p)
      showToast(p === 'granted' ? 'Notifikasi desktop diaktifkan' : 'Notifikasi desktop tidak diaktifkan', {
        type: p === 'granted' ? 'success' : 'warning',
        duration: 3000,
        idKey: `perm-${p}`
      })
    } catch {}
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationIds: [id] })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications:updated'))
        }
      }
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        prevUnreadRef.current = 0
        showToast('Semua notifikasi ditandai sudah dibaca', { type: 'success', duration: 2500, idKey: 'mark-all' })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications:updated'))
        }
      }
    } catch {}
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
        showToast('Notifikasi dihapus', { type: 'success', duration: 1500, idKey: `del-${id}` })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications:updated'))
        }
      }
    } catch {}
  }


  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('notificationSoundEnabled', String(next))
    showToast(next ? 'Suara notifikasi aktif' : 'Suara notifikasi dimatikan', {
      type: next ? 'success' : 'warning',
      duration: 2000,
      idKey: `sound-${next}`
    })
    if (next && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Baru saja'
      if (diffMins < 60) return `${diffMins} menit yang lalu`
      if (diffHours < 24) return `${diffHours} jam yang lalu`
      if (diffDays < 7) return `${diffDays} hari yang lalu`

      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }


  // Set up polling for notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchUnreadAndNotify()
      }
    }, 15000) // Check every 15 seconds for more real-time updates

    return () => clearInterval(interval)
  }, [fetchUnreadAndNotify])

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        ref={bellRef}
        onClick={toggleDropdown}
        className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-card-hover rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 transform hover:scale-105"
        aria-label="Notifikasi"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6 text-accent" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && mounted && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-xl dark:shadow-dark border border-border z-[9999] overflow-hidden transform transition-all duration-200 ease-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800 bg-gradient-to-r from-white to-blue-50 dark:from-slate-900 dark:to-slate-800">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <BellRing className="h-5 w-5 mr-2 text-accent" />
                Notifikasi
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchNotifications()}
                  className={cn(
                    "p-1.5 text-text-muted hover:text-text-secondary hover:bg-card-hover rounded-lg transition-all duration-200",
                    isRefreshing && "animate-spin text-accent"
                  )}
                  title="Refresh notifikasi"
                  disabled={isRefreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {notificationSupported && notificationPermission !== 'granted' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="p-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-800/50 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Bell className="h-3 w-3" />
                    <span>Izinkan Notifikasi</span>
                  </button>
                )}
                <button
                  onClick={toggleSound}
                  className={cn(
                    "p-1.5 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors",
                    soundEnabled ? "text-success" : "text-gray-500 dark:text-gray-400"
                  )}
                  title={soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={cn(
                    "p-1.5 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors",
                    isSettingsOpen ? "text-accent" : "text-gray-500 dark:text-gray-400"
                  )}
                  title="Pengaturan notifikasi"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Settings Panel */}
            {isSettingsOpen && (
              <div className="p-3 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Suara Notifikasi</span>
                    <button
                      onClick={toggleSound}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        soundEnabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          soundEnabled ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Notifikasi Desktop</span>
                    <button
                      onClick={requestNotificationPermission}
                      disabled={!notificationSupported || notificationPermission === 'denied'}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        notificationPermission === 'granted' ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700",
                        (!notificationSupported || notificationPermission === 'denied') && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          notificationPermission === 'granted' ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className={cn(
                      "mt-1 w-full py-1.5 px-3 text-sm font-medium rounded-lg transition-all duration-200",
                      unreadCount > 0
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-800/50"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                    )}
                  >
                    Tandai Semua Dibaca
                  </button>
                </div>
              </div>
            )}
            
            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  activeTab === 'all'
                    ? "text-accent border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  activeTab === 'unread'
                    ? "text-accent border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : notifications.length === 0 || (activeTab === 'unread' && unreadCount === 0) ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                  <Bell className="h-10 w-10 mb-2 text-gray-300 dark:text-gray-600" />
                  <p>{activeTab === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Tidak ada notifikasi'}</p>
                </div>
              ) : (
                notifications
                  .filter(notification => activeTab === 'all' || !notification.isRead)
                  .map((notification) => {
                      
                    const priorityBadge = {
                      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 animate-pulse'
                    }
                    
                    // Icon based on notification type
                    const NotificationIcon = {
                      success: CheckCircle,
                      warning: AlertTriangle,
                      error: AlertCircle,
                      info: Info
                    }[notification.type || 'info'] || Bell;
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          `p-3 rounded-lg border transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]`,
                          notification.isRead 
                            ? 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/60' 
                            : `bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-700/60 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/30 hover:shadow-lg hover:ring-2 hover:ring-blue-300/50 dark:hover:ring-blue-700/50`
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {notification.category && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                  {notification.category}
                                </span>
                              )}
                              {notification.priority && (
                                <span className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm",
                                  priorityBadge[notification.priority] || priorityBadge.medium
                                )}>
                                  {notification.priority === 'urgent' && '🔴 '}
                                  {notification.priority === 'high' ? 'Penting' : 
                                   notification.priority === 'medium' ? 'Sedang' : 
                                   notification.priority === 'low' ? 'Rendah' : 
                                   notification.priority === 'urgent' ? 'Urgent' : ''}
                                </span>
                              )}
                              {!notification.isRead && (
                                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-bounce shadow-lg ring-2 ring-blue-200 dark:ring-blue-800/50"></span>
                              )}
                            </div>
                            
                            <div className="flex items-start">
                              <div className={cn(
                                "mr-2 mt-0.5 flex-shrink-0",
                                notification.type === 'success' ? "text-success" :
                                notification.type === 'warning' ? "text-yellow-600 dark:text-yellow-400" :
                                notification.type === 'error' ? "text-red-600 dark:text-red-400" :
                                "text-accent"
                              )}>
                                <NotificationIcon className="h-4 w-4" />
                              </div>
                              
                              <div>
                                <h4 className={cn(
                                  `text-sm font-medium`,
                                  notification.isRead 
                                    ? 'text-gray-900 dark:text-slate-200' 
                                    : 'text-blue-900 dark:text-blue-100 font-semibold'
                                )}>
                                  {notification.title}
                                </h4>
                                
                                <p className={cn(
                                  `mt-1 text-sm`,
                                  notification.isRead 
                                    ? 'text-gray-600 dark:text-slate-400' 
                                    : 'text-blue-800 dark:text-blue-200'
                                )}>
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-slate-500">
                                {formatDate(notification.createdAt)}
                              </span>
                              
                              {notification.actionUrl && (
                                <Link 
                                  href={notification.actionUrl}
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors hover:underline"
                                >
                                  {notification.actionText || 'Lihat'}
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 bg-blue-50 dark:bg-blue-900/20"
                                title="Tandai sudah dibaca"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition-colors shadow-sm hover:shadow"
                              title="Hapus notifikasi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700">
                <Link
                  href={session?.user?.role === 'ADMIN' ? '/admin/notifications' : '/employee/notifications'}
                  className="block w-full text-center py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center">
                    <span>Lihat Semua Notifikasi</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
