'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, X, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'
import { useToast } from './providers/ToastProvider'

interface NotificationItem {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  taskId?: string
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [mounted, setMounted] = useState(false)

  const bellRef = useRef<HTMLButtonElement | null>(null)
  const prevUnreadRef = useRef<number>(0)
  const seenIdsRef = useRef<Set<string>>(new Set()) // NEW: untuk anti-duplicate
  const pollingRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { showToast } = useToast()

  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window

  const fetchNotifications = useCallback(async (opts?: { limit?: number }) => {
    setLoading(true)
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

        if (notificationSupported && notificationPermission === 'granted' && latest) {
          try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(latest.title || 'Notifikasi Baru', {
                  body: latest.message,
                  icon: '/valprologo.webp',
                  badge: '/valprologo.webp',
                  tag: latest.id,
                  renotify: true,
                  data: { url: latest.taskId ? `/admin/tasks` : '/admin/notifications', id: latest.id }
                })
              })
            } else {
              new Notification(latest.title || 'Notifikasi Baru', { body: latest.message, icon: '/valprologo.webp' })
            }
          } catch {}
        }
      }

      setUnreadCount(newUnread)
      prevUnreadRef.current = newUnread
    } catch {}
  }, [notificationPermission, showToast, soundEnabled, notificationSupported])

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

    pollingRef.current = window.setInterval(() => {
      fetchUnreadAndNotify()
    }, 30000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchNotifications, fetchUnreadAndNotify, notificationSupported])

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
      if (p === 'granted' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (!reg) {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        }
      }
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

  const formatDate = (d: string) => {
    try {
      const date = new Date(d)
      const now = new Date()
      const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
      if (diff < 1) return 'Baru saja'
      if (diff < 60) return `${diff} menit yang lalu`
      if (diff < 1440) return `${Math.floor(diff / 60)} jam yang lalu`
      return `${Math.floor(diff / 1440)} hari yang lalu`
    } catch {
      return d
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        ref={bellRef}
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
        aria-label="Notifikasi"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && mounted && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
              <div className="flex items-center space-x-2">
                {notificationSupported && notificationPermission !== 'granted' && (
                  <button onClick={requestNotificationPermission} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                    Aktifkan Notifikasi
                  </button>
                )}
                <button onClick={toggleSound} className="p-1 text-gray-500 hover:text-gray-700">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">
                    Tandai Semua
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Memuat notifikasi...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Tidak ada notifikasi</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-gradient-to-r from-blue-50 to-white' : ''}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                          {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{formatDate(n.createdAt)}</span>
                          <div className="flex items-center space-x-2">
                            {n.taskId && (
                              <Link href="/admin/tasks" className="text-xs text-blue-600 hover:text-blue-800" onClick={() => setIsOpen(false)}>
                                Lihat Tugas
                              </Link>
                            )}
                            {!n.isRead && (
                              <button onClick={() => markAsRead(n.id)} className="text-xs text-gray-500 hover:text-gray-700">Tandai Dibaca</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100">
                <Link href="/admin/notifications" className="block text-center text-sm text-blue-600 hover:text-blue-800" onClick={() => setIsOpen(false)}>
                  Lihat Semua Notifikasi
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
