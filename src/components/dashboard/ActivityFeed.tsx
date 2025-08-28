'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export interface ActivityItem {
  id: string
  type: 'task' | 'attendance' | 'leave' | 'wfh' | 'user' | 'system'
  title: string
  description: string
  user: string
  timestamp: string
  status?: string
  priority?: 'low' | 'medium' | 'high'
  actionUrl?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
  showUser?: boolean
  showStatus?: boolean
  title?: string
  className?: string
}

export function ActivityFeed({ 
  activities, 
  maxItems = 10, 
  showUser = true, 
  showStatus = true,
  title,
  className = '' 
}: ActivityFeedProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  // Safety check for undefined activities
  if (!activities || !Array.isArray(activities)) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {title}
            </h3>
          )}
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada aktivitas terbaru
            </p>
          </div>
        </div>
      </div>
    )
  }

  const displayActivities = activities.slice(0, maxItems)
  
  const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task':
        return '📋'
      case 'attendance':
        return '⏰'
      case 'leave':
        return '📅'
      case 'wfh':
        return '🏠'
      case 'user':
        return '👤'
      case 'system':
        return '⚙️'
      default:
        return '📝'
    }
  }

  const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'attendance':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'leave':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'wfh':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'user':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'system':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority?: ActivityItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Baru saja'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} jam yang lalu`
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (displayActivities.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {title}
            </h3>
          )}
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada aktivitas terbaru
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <Link
              href="/admin/activities"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Lihat Semua
            </Link>
          </div>
        )}
        <div className="space-y-4">
          {displayActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg">{getTypeIcon(activity.type)}</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(activity.type)}`}>
                    {activity.type === 'task' && 'Tugas'}
                    {activity.type === 'attendance' && 'Kehadiran'}
                    {activity.type === 'leave' && 'Izin'}
                    {activity.type === 'wfh' && 'WFH'}
                    {activity.type === 'user' && 'User'}
                    {activity.type === 'system' && 'Sistem'}
                  </span>
                  
                  {activity.priority && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                      {activity.priority === 'high' && 'Tinggi'}
                      {activity.priority === 'medium' && 'Sedang'}
                      {activity.priority === 'low' && 'Rendah'}
                    </span>
                  )}
                  
                  {showStatus && activity.status && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {activity.status}
                    </span>
                  )}
                </div>
                
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {activity.title}
                </h4>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {activity.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    {showUser && (
                      <span className="font-medium">Oleh: {activity.user}</span>
                    )}
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{formatTimestamp(activity.timestamp)}</span>
                  </div>
                  
                  {activity.actionUrl && (
                    <Link
                      href={activity.actionUrl}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
                    >
                      Lihat Detail
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Configuration functions for admin and employee activity feeds
export function adminActivityFeed(activities: any[]) {
  return activities.map(activity => ({
    id: activity.id,
    type: activity.type || 'system',
    title: activity.title || 'Aktivitas Sistem',
    description: activity.description || 'Tidak ada deskripsi',
    user: activity.user?.name || 'Sistem',
    timestamp: activity.createdAt || new Date().toISOString(),
    status: activity.status,
    priority: activity.priority || 'medium',
    actionUrl: activity.actionUrl
  }))
}

export function employeeActivityFeed(activities: any[]) {
  return activities.map(activity => ({
    id: activity.id,
    type: activity.type || 'task',
    title: activity.title || 'Aktivitas Tugas',
    description: activity.description || 'Tidak ada deskripsi',
    user: activity.user?.name || 'Sistem',
    timestamp: activity.createdAt || new Date().toISOString(),
    status: activity.status,
    priority: activity.priority || 'medium',
    actionUrl: activity.actionUrl
  }))
}
