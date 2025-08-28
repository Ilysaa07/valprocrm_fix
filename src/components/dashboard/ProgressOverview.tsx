'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { CheckCircle, Clock, Circle, Calendar } from 'lucide-react'

export interface ProgressItem {
  label: string
  value: number
  total: number
  color: string
  icon?: any
}

interface ProgressOverviewProps {
  items?: ProgressItem[]
  title?: string
  className?: string
}

export function ProgressOverview({ items = [], title, className = '' }: ProgressOverviewProps) {
  // Ensure items is always an array to prevent TypeError
  const safeItems = Array.isArray(items) ? items : []
  
  return (
    <Card className={className}>
      <CardBody>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <div className="space-y-4">
          {safeItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Tidak ada data progress
            </div>
          ) : (
            safeItems.map((item, index) => {
              const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0
              const Icon = item.icon
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.value} / {item.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}% selesai
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardBody>
    </Card>
  )
}

// Configuration functions for different progress types
export function taskProgressConfig(stats: any = {}) {
  const totalTasks = stats?.totalTasks || 0
  const completedTasks = stats?.completedTasks || 0
  const pendingTasks = stats?.pendingTasks || 0
  
  return [
    {
      label: 'Tugas Selesai',
      value: completedTasks,
      total: totalTasks,
      color: 'bg-green-500',
      icon: CheckCircle
    },
    {
      label: 'Tugas Pending',
      value: pendingTasks,
      total: totalTasks,
      color: 'bg-yellow-500',
      icon: Clock
    },
    {
      label: 'Tugas Belum Dimulai',
      value: Math.max(0, totalTasks - completedTasks - pendingTasks),
      total: totalTasks,
      color: 'bg-gray-500',
      icon: Circle
    }
  ]
}

export function attendanceProgressConfig(stats: any = {}) {
  const totalDays = 5 // Assuming 5 working days per week
  const presentDays = stats?.todayPresent ? 1 : 0
  
  return [
    {
      label: 'Kehadiran Minggu Ini',
      value: presentDays,
      total: totalDays,
      color: 'bg-blue-500',
      icon: Calendar
    }
  ]
}
