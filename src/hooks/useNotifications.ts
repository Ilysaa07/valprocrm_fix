import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface NotificationCounts {
  unreadNotifications: number
  unreadMessages: number
  pendingTasks: number
  pendingApprovals: number
}

export function useNotifications() {
  const { data: session } = useSession()
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadNotifications: 0,
    unreadMessages: 0,
    pendingTasks: 0,
    pendingApprovals: 0
  })

  useEffect(() => {
    if (!session) return

    // Fetch initial counts
    fetchCounts()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [session])

  const fetchCounts = async () => {
    try {
      // Fetch all counts in parallel
      const [notifications, messages, tasks, approvals] = await Promise.allSettled([
        fetch('/api/notifications/count').then(res => res.json()),
        fetch('/api/chat/unread-count').then(res => res.json()),
        fetch('/api/tasks/pending-count').then(res => res.json()),
        fetch('/api/users/pending-approvals').then(res => res.json())
      ])

      setCounts({
        unreadNotifications: notifications.status === 'fulfilled' ? (notifications.value.count || 0) : 0,
        unreadMessages: messages.status === 'fulfilled' ? (messages.value.count || 0) : 0,
        pendingTasks: tasks.status === 'fulfilled' ? (tasks.value.count || 0) : 0,
        pendingApprovals: approvals.status === 'fulfilled' ? (approvals.value.count || 0) : 0
      })
    } catch (error) {
      console.error('Error fetching notification counts:', error)
    }
  }

  return counts
}
