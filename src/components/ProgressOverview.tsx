'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface ProgressItem {
  label: string
  current: number
  total: number
  color: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProgressOverviewProps {
  title: string
  items: ProgressItem[]
  showTotal?: boolean
  className?: string
}

export function ProgressOverview({ title, items, showTotal = true, className = '' }: ProgressOverviewProps) {
  const calculatePercentage = (current: number, total: number) => {
    if (total <= 0) return 0
    const percentage = Math.round((current / total) * 100)
    return isNaN(percentage) || !isFinite(percentage) ? 0 : percentage
  }

  const getTotalCompleted = () => {
    return items.reduce((sum, item) => sum + item.current, 0)
  }

  const getTotalTasks = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const getOverallPercentage = () => {
    const totalCompleted = getTotalCompleted()
    const totalTasks = getTotalTasks()
    return calculatePercentage(totalCompleted, totalTasks)
  }

  return (
    <Card className={className}>
      <CardBody>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-2" />
                  <span>{item.label}</span>
                </div>
                <span>{item.current}/{item.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all duration-300`}
                  style={{ 
                    width: `${calculatePercentage(item.current, item.total)}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        {showTotal && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              {getTotalTasks() > 0 ? (
                <>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {getOverallPercentage()}% selesai
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getTotalCompleted()} dari {getTotalTasks()} total
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Belum ada data untuk ditampilkan
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// Predefined progress configurations
export const taskProgressConfig = (stats: any) => [
  {
    label: 'Tugas Selesai',
    current: stats.completedTasks || 0,
    total: stats.totalTasks || 0,
    color: 'bg-green-500',
    icon: CheckCircle
  },
  {
    label: 'Tugas Dalam Progress',
    current: stats.inProgressTasks || 0,
    total: stats.totalTasks || 0,
    color: 'bg-yellow-500',
    icon: Clock
  },
  {
    label: 'Tugas Belum Dimulai',
    current: stats.notStartedTasks || 0,
    total: stats.totalTasks || 0,
    color: 'bg-gray-500',
    icon: AlertCircle
  }
]

export const attendanceProgressConfig = (stats: any) => [
  {
    label: 'Hadir',
    current: stats.todayPresent || 0,
    total: stats.totalUsers || 0,
    color: 'bg-green-500',
    icon: CheckCircle
  },
  {
    label: 'WFH',
    current: stats.todayWFH || 0,
    total: stats.totalUsers || 0,
    color: 'bg-purple-500',
    icon: Clock
  },
  {
    label: 'Tidak Hadir',
    current: stats.todayAbsent || 0,
    total: stats.totalUsers || 0,
    color: 'bg-red-500',
    icon: AlertCircle
  }
]
