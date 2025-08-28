'use client'

import { Users, CheckSquare, Calendar, Clock, Bell, Home, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface QuickStatItem {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  description?: string
}

interface QuickStatsProps {
  items: QuickStatItem[]
  title?: string
  layout?: 'grid' | 'list'
  className?: string
}

export function QuickStats({ 
  items, 
  title, 
  layout = 'grid',
  className = '' 
}: QuickStatsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon
        
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${item.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {item.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {item.value}
              </p>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              )}
              
              {item.trend && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${item.trend.isPositive ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'}`}>
                      {item.trend.isPositive ? '↗' : '↘'} {item.trend.value}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.trend.period}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderListLayout = () => (
    <div className="space-y-4">
      {items.map((item, index) => {
        const Icon = item.icon
        
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
                {item.trend && (
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className={`text-xs font-medium ${item.trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.trend.isPositive ? '↗' : '↘'} {item.trend.value}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      {layout === 'grid' ? renderGridLayout() : renderListLayout()}
    </div>
  )
}

// Configuration functions for different quick stats types
export function adminQuickStats(stats: any) {
  return [
    {
      label: 'Total Karyawan',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-600',
      description: 'Karyawan aktif'
    },
    {
      label: 'Tugas Selesai',
      value: stats.completedTasks || 0,
      icon: CheckSquare,
      color: 'bg-green-600',
      description: 'Tugas yang diselesaikan'
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.todayPresent || 0,
      icon: Calendar,
      color: 'bg-purple-600',
      description: 'Kehadiran hari ini'
    },
    {
      label: 'Pending Approval',
      value: stats.pendingLeaveRequests || 0,
      icon: Clock,
      color: 'bg-orange-600',
      description: 'Menunggu persetujuan'
    }
  ]
}

export function employeeQuickStats(stats: any) {
  return [
    {
      label: 'Tugas Aktif',
      value: stats.pendingTasks || 0,
      icon: CheckSquare,
      color: 'bg-blue-600',
      description: 'Tugas yang belum selesai'
    },
    {
      label: 'Tugas Selesai',
      value: stats.completedTasks || 0,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'Tugas yang diselesaikan'
    },
    {
      label: 'Kehadiran Bulan Ini',
      value: stats.monthlyAttendance || 0,
      icon: Calendar,
      color: 'bg-purple-600',
      description: 'Hari hadir bulan ini'
    },
    {
      label: 'Notifikasi',
      value: stats.unreadNotifications || 0,
      icon: Bell,
      color: 'bg-orange-600',
      description: 'Notifikasi belum dibaca'
    }
  ]
}

export function attendanceQuickStats(stats: any) {
  return [
    {
      label: 'Hadir',
      value: stats.todayPresent || 0,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'Karyawan hadir hari ini'
    },
    {
      label: 'Tidak Hadir',
      value: stats.todayAbsent || 0,
      icon: XCircle,
      color: 'bg-red-600',
      description: 'Karyawan tidak hadir'
    },
    {
      label: 'Work From Home',
      value: stats.todayWFH || 0,
      icon: Home,
      color: 'bg-blue-600',
      description: 'Karyawan WFH hari ini'
    },
    {
      label: 'Terlambat',
      value: stats.todayLate || 0,
      icon: AlertTriangle,
      color: 'bg-orange-600',
      description: 'Karyawan terlambat'
    }
  ]
}

export function taskQuickStats(stats: any) {
  return [
    {
      label: 'Total Tugas',
      value: stats.totalTasks || 0,
      icon: CheckSquare,
      color: 'bg-gray-600',
      description: 'Semua tugas'
    },
    {
      label: 'Dalam Progress',
      value: stats.pendingTasks || 0,
      icon: Clock,
      color: 'bg-blue-600',
      description: 'Tugas sedang dikerjakan'
    },
    {
      label: 'Selesai',
      value: stats.completedTasks || 0,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'Tugas selesai'
    },
    {
      label: 'Overdue',
      value: stats.overdueTasks || 0,
      icon: AlertCircle,
      color: 'bg-red-600',
      description: 'Tugas terlambat'
    }
  ]
}
