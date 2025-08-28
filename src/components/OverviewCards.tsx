'use client'

import { Card, CardBody } from '@/components/ui/Card'

interface OverviewItem {
  label: string
  value: number | string
  color: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

interface OverviewCardsProps {
  title: string
  items: OverviewItem[]
  className?: string
}

export function OverviewCards({ title, items, className = '' }: OverviewCardsProps) {
  const colorClasses = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-purple-600',
    neutral: 'text-gray-600'
  }

  return (
    <Card className={className}>
      <CardBody>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className={`font-semibold ${colorClasses[item.color]}`}>
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

// Predefined overview configurations
export const attendanceOverviewConfig = (stats: any) => [
  {
    label: 'Hadir',
    value: stats.todayPresent || 0,
    color: 'success' as const
  },
  {
    label: 'WFH',
    value: stats.todayWFH || 0,
    color: 'info' as const
  },
  {
    label: 'Tidak Hadir',
    value: stats.todayAbsent || 0,
    color: 'danger' as const
  }
]

export const leaveOverviewConfig = (stats: any) => [
  {
    label: 'Pending',
    value: stats.pendingLeaveRequests || 0,
    color: 'warning' as const
  },
  {
    label: 'Disetujui',
    value: stats.approvedLeaveRequests || 0,
    color: 'success' as const
  },
  {
    label: 'Ditolak',
    value: stats.rejectedLeaveRequests || 0,
    color: 'danger' as const
  }
]

export const wfhOverviewConfig = (stats: any) => [
  {
    label: 'Pending',
    value: stats.pendingWFHLogs || 0,
    color: 'warning' as const
  },
  {
    label: 'Disetujui',
    value: stats.approvedWFHLogs || 0,
    color: 'success' as const
  },
  {
    label: 'Ditolak',
    value: stats.rejectedWFHLogs || 0,
    color: 'danger' as const
  }
]

export const taskOverviewConfig = (stats: any) => [
  {
    label: 'Selesai',
    value: stats.completedTasks || 0,
    color: 'success' as const
  },
  {
    label: 'Dalam Progress',
    value: stats.inProgressTasks || 0,
    color: 'warning' as const
  },
  {
    label: 'Belum Dimulai',
    value: stats.notStartedTasks || 0,
    color: 'neutral' as const
  }
]
