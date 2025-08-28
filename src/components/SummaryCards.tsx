'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  changeLabel?: string
  icon?: React.ComponentType<{ className?: string }>
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

interface SummaryCardsProps {
  cards: SummaryCardProps[]
  className?: string
}

export function SummaryCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  changeLabel,
  icon: Icon,
  color = 'primary',
  className = '' 
}: SummaryCardProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {Icon && (
              <div className={`p-3 rounded-lg ${colorClasses[color]} border mr-4`}>
                <Icon className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatValue(value)}</p>
            </div>
          </div>
          
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {getChangeIcon()}
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className={`text-xs ${getChangeColor()}`}>
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export function SummaryCards({ cards, className = '' }: SummaryCardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {cards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  )
}

// Predefined summary card configurations
export const adminSummaryCards = (stats: any, previousStats?: any) => [
  {
    title: 'Total Karyawan',
    value: stats.totalUsers || 0,
    change: previousStats ? calculateChange(stats.totalUsers, previousStats.totalUsers) : undefined,
    changeType: previousStats ? getChangeType(stats.totalUsers, previousStats.totalUsers) : 'neutral',
    changeLabel: 'dari bulan lalu',
    icon: require('lucide-react').Users,
    color: 'primary' as const
  },
  {
    title: 'Hadir Hari Ini',
    value: stats.todayPresent || 0,
    change: previousStats ? calculateChange(stats.todayPresent, previousStats.todayPresent) : undefined,
    changeType: previousStats ? getChangeType(stats.todayPresent, previousStats.todayPresent) : 'neutral',
    changeLabel: 'dari kemarin',
    icon: require('lucide-react').UserCheck,
    color: 'success' as const
  },
  {
    title: 'Tugas Selesai',
    value: stats.completedTasks || 0,
    change: previousStats ? calculateChange(stats.completedTasks, previousStats.completedTasks) : undefined,
    changeType: previousStats ? getChangeType(stats.completedTasks, previousStats.completedTasks) : 'neutral',
    changeLabel: 'dari minggu lalu',
    icon: require('lucide-react').CheckCircle,
    color: 'success' as const
  },
  {
    title: 'Izin Pending',
    value: stats.pendingLeaveRequests || 0,
    change: previousStats ? calculateChange(stats.pendingLeaveRequests, previousStats.pendingLeaveRequests) : undefined,
    changeType: previousStats ? getChangeType(stats.pendingLeaveRequests, previousStats.pendingLeaveRequests) : 'neutral',
    changeLabel: 'dari kemarin',
    icon: require('lucide-react').Clock,
    color: 'warning' as const
  }
]

export const employeeSummaryCards = (stats: any, previousStats?: any) => [
  {
    title: 'Total Tugas',
    value: stats.totalTasks || 0,
    change: previousStats ? calculateChange(stats.totalTasks, previousStats.totalTasks) : undefined,
    changeType: previousStats ? getChangeType(stats.totalTasks, previousStats.totalTasks) : 'neutral',
    changeLabel: 'dari minggu lalu',
    icon: require('lucide-react').CheckSquare,
    color: 'primary' as const
  },
  {
    title: 'Tugas Selesai',
    value: stats.completedTasks || 0,
    change: previousStats ? calculateChange(stats.completedTasks, previousStats.completedTasks) : undefined,
    changeType: previousStats ? getChangeType(stats.completedTasks, previousStats.completedTasks) : 'neutral',
    changeLabel: 'dari minggu lalu',
    icon: require('lucide-react').CheckCircle,
    color: 'success' as const
  },
  {
    title: 'Izin Pending',
    value: stats.pendingLeaveRequests || 0,
    change: previousStats ? calculateChange(stats.pendingLeaveRequests, previousStats.pendingLeaveRequests) : undefined,
    changeType: previousStats ? getChangeType(stats.pendingLeaveRequests, previousStats.pendingLeaveRequests) : 'neutral',
    changeLabel: 'dari bulan lalu',
    icon: require('lucide-react').Clock,
    color: 'warning' as const
  },
  {
    title: 'Notifikasi',
    value: stats.unreadNotifications || 0,
    change: previousStats ? calculateChange(stats.unreadNotifications, previousStats.unreadNotifications) : undefined,
    changeType: previousStats ? getChangeType(stats.unreadNotifications, previousStats.unreadNotifications) : 'neutral',
    changeLabel: 'dari kemarin',
    icon: require('lucide-react').Bell,
    color: 'info' as const
  }
]

// Helper functions
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function getChangeType(current: number, previous: number): 'increase' | 'decrease' | 'neutral' {
  if (current > previous) return 'increase'
  if (current < previous) return 'decrease'
  return 'neutral'
}
