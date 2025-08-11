'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  taskId?: string
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [userInteracted, setUserInteracted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check if browser supports notifications
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window

  // Fallback to standard notification API
  const fallbackToStandardNotification = useCallback((title: string, options: NotificationOptions) => {
    const notification = new Notification(title, options)
    
    // Handle notification click
    notification.onclick = () => {
      // Focus the window and navigate to notifications page if needed
      window.focus()
      
      // Close the notification
      notification.close()
      
      // Open the dropdown if it's not already open
      if (!isOpen) {
        setIsOpen(true)
      }
    }
    
    return notification
  }, [isOpen, setIsOpen])

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (!notificationSupported || notificationPermission !== 'granted') return
    
    try {
      // Enhanced options for better mobile and desktop experience
      const enhancedOptions: NotificationOptions = {
        icon: '/valprologo.webp', // Icon for desktop notifications
        badge: '/valprologo.webp', // Badge for mobile notifications
        vibrate: [200, 100, 200], // Vibration pattern for mobile
        silent: false, // Allow sound on mobile if supported
        requireInteraction: true, // Keep notification visible until user interacts with it
        ...options
      }
      
      // Try to use service worker for notifications if available (better for mobile)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          // Use service worker showNotification for better mobile support
          registration.showNotification(title, {
            ...enhancedOptions,
            // Add data for handling notification click
            data: {
              url: '/admin/notifications',
              timestamp: new Date().getTime()
            },
            // Add actions for mobile notifications
            actions: [
              {
                action: 'view',
                title: 'Lihat'
              },
              {
                action: 'close',
                title: 'Tutup'
              }
            ]
          }).catch(error => {
            console.error('Error showing notification via service worker:', error)
          })
        }).catch(error => {
          console.error('Service worker not ready:', error)
          // Fallback to standard notification
          fallbackToStandardNotification(title, enhancedOptions)
        })
      } else {
        // Fallback to standard notification API
        return fallbackToStandardNotification(title, enhancedOptions)
      }
    } catch (error) {
      console.error('Error showing browser notification:', error)
    }
  }, [notificationSupported, notificationPermission, fallbackToStandardNotification])

  // Play notification sound safely
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return
    
    // Only try to play if user has interacted with the page
    if (userInteracted) {
      // Create a new audio instance each time to avoid issues with replaying
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.5 // Set volume to 50%
      
      audio.play().catch(err => {
        console.error('Error playing notification sound:', err)
      })
    }
  }, [soundEnabled, userInteracted])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?unread=true')
      if (response.ok) {
        const data = await response.json()
        const newUnreadCount = data.notifications?.length || 0
        
        // Check if there are new notifications
        if (newUnreadCount > previousUnreadCount) {
          // Play notification sound
          playNotificationSound()
          
          // Show browser notification if we have permission
          if (notificationPermission === 'granted' && data.notifications && data.notifications.length > 0) {
            const latestNotification = data.notifications[0]
            showBrowserNotification('Notifikasi Baru', {
              body: latestNotification.message,
              tag: latestNotification.id, // Prevent duplicate notifications
              renotify: true
            })
          }
        }
        
        setUnreadCount(newUnreadCount)
        setPreviousUnreadCount(newUnreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [notificationPermission, previousUnreadCount, showBrowserNotification, playNotificationSound])

  useEffect(() => {
    fetchNotifications()
    // Fetch unread count
    fetchUnreadCount()
    
    // Initialize audio element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
      // Preload audio to prepare it for playback
      audioRef.current.load()
    }
    
    // Load sound preference from localStorage
    const savedSoundPreference = localStorage.getItem('notificationSoundEnabled')
    if (savedSoundPreference !== null) {
      setSoundEnabled(savedSoundPreference === 'true')
    }
    
    // Check notification permission
    if (notificationSupported) {
      setNotificationPermission(Notification.permission)
    }
    
    // Set up polling for new notifications
    const intervalId = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Check every 30 seconds
    
    // Set user interaction flag when user interacts with the page
    const handleUserInteraction = () => {
      setUserInteracted(true)
      // Remove event listeners after first interaction
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
    }
    
    window.addEventListener('click', handleUserInteraction)
    window.addEventListener('keydown', handleUserInteraction)
    window.addEventListener('touchstart', handleUserInteraction)
    
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [fetchUnreadCount, notificationSupported])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=5')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Request notification permission and register service worker if available
  const requestNotificationPermission = async () => {
    if (!notificationSupported) return
    
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      // If permission granted, try to register service worker for better mobile support
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          // Check if service worker is already registered
          const registration = await navigator.serviceWorker.getRegistration()
          
          if (!registration) {
            // Register service worker if not already registered
            await navigator.serviceWorker.register('/sw.js', { scope: '/' })
              .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope)
              })
              .catch((error) => {
                console.error('Service Worker registration failed:', error)
              })
          }
        } catch (error) {
          console.error('Error checking service worker registration:', error)
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }



  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: [notificationId]
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
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
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        )
        setUnreadCount(0)
        setPreviousUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }
  
  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled
    setSoundEnabled(newSoundEnabled)
    localStorage.setItem('notificationSoundEnabled', newSoundEnabled.toString())
    
    // Set user interacted flag to true when user toggles sound
    // This ensures audio can be played after user interaction
    setUserInteracted(true)
    
    // If enabling sound, try to play a short test sound to confirm it works
    if (newSoundEnabled && userInteracted) {
      const testAudio = new Audio('/notification.mp3')
      testAudio.volume = 0.2 // Lower volume for test
      testAudio.play().catch(err => {
        console.error('Error playing test sound:', err)
      })
    }
    
    // If notifications are not yet enabled, ask for permission
    if (notificationSupported && notificationPermission !== 'granted') {
      requestNotificationPermission()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`
    return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setUserInteracted(true)
          
          // If we have unread notifications and sound is enabled, try to play sound
          // This will work because the click on the bell is a user interaction
          if (unreadCount > 0 && soundEnabled && !isOpen) {
            playNotificationSound()
          }
          
          // Request notification permission if not granted yet
          if (notificationSupported && notificationPermission !== 'granted') {
            requestNotificationPermission()
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
            <div className="flex items-center space-x-2">
              {notificationSupported && notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  title="Aktifkan notifikasi desktop"
                >
                  Aktifkan Notifikasi
                </button>
              )}
              <button
                onClick={toggleSound}
                className="text-gray-400 hover:text-gray-600 p-1"
                title={soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tandai Semua Dibaca
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada notifikasi
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            <div className="flex items-center space-x-2">
                              {notification.taskId && (
                                <Link
                                  href={`/admin/tasks`}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                  onClick={() => setIsOpen(false)}
                                >
                                  Lihat Tugas
                                </Link>
                              )}
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Tandai Dibaca
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

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Link
                  href="/admin/notifications"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setIsOpen(false)}
                >
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

