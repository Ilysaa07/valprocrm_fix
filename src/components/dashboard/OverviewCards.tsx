'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { CheckCircle, XCircle, Home, Clock, CheckSquare } from 'lucide-react'

export interface OverviewItem {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface OverviewCardsProps {
  items: OverviewItem[]
  title?: string
  className?: string
}

export function OverviewCards({ items, title, className = '' }: OverviewCardsProps) {
  // Safety check for undefined items
  const safeItems = Array.isArray(items) ? items : []
  
  return (
    <Card className={className}>
      <CardBody>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <div className="space-y-3">
          {safeItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Tidak ada data overview
            </div>
          ) : (
            safeItems.map((item, index) => {
              const Icon = item.icon
            
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      {Icon && <Icon className="h-5 w-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {item.value}
                      </p>
                    </div>
                  </div>
                  {item.trend && (
                    <div className="text-right">
                      <span className={`text-sm font-medium ${item.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {item.trend.isPositive ? '+' : ''}{item.trend.value}%
                      </span>
                      <p className="text-xs text-gray-500">
                        dari kemarin
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardBody>
    </Card>
  )
}

// Configuration functions for different overview types
export function attendanceOverviewConfig(stats: any) {
  return [
    {
      label: 'Hadir Hari Ini',
      value: stats.todayPresent || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      label: 'Tidak Hadir',
      value: stats.todayAbsent || 0,
      icon: XCircle,
      color: 'bg-red-500'
    },
    {
      label: 'WFH',
      value: stats.todayWFH || 0,
      icon: Home,
      color: 'bg-blue-500'
    }
  ]
}

export function leaveOverviewConfig(stats: any) {
  return [
    {
      label: 'Menunggu Validasi',
      value: stats.pendingLeaveRequests || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      label: 'Disetujui',
      value: stats.approvedLeaveRequests || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      label: 'Ditolak',
      value: stats.rejectedLeaveRequests || 0,
      icon: XCircle,
      color: 'bg-red-500'
    }
  ]
}

export function wfhOverviewConfig(stats: any) {
  return [
    {
      label: 'Menunggu Validasi',
      value: stats.pendingWFHLogs || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      label: 'Disetujui',
      value: stats.approvedWFHLogs || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      label: 'Ditolak',
      value: stats.rejectedWFHLogs || 0,
      icon: XCircle,
      color: 'bg-red-500'
    }
  ]
}

export function taskOverviewConfig(stats: any) {
  return [
    {
      label: 'Total Tugas',
      value: stats.totalTasks || 0,
      icon: CheckSquare,
      color: 'bg-blue-500'
    },
    {
      label: 'Selesai',
      value: stats.completedTasks || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      label: 'Menunggu Validasi',
      value: stats.pendingValidationTasks || stats.pendingTasks || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      label: 'Revisi',
      value: stats.revisionTasks || 0,
      icon: Clock,
      color: 'bg-amber-500'
    }
  ]
}
