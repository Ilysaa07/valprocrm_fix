'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface DashboardStatsProps {
  stats: StatCardProps[]
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, trendValue, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]} border`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </div>
          </div>
          {trend && trendIcon && (
            <div className="flex items-center space-x-1">
              <trendIcon className={`h-4 w-4 ${trendColor}`} />
              {trendValue && (
                <span className={`text-sm font-medium ${trendColor}`}>{trendValue}</span>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export function DashboardStats({ stats, className = '' }: DashboardStatsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

// Predefined stat configurations
export const adminStatConfigs = [
  {
    title: 'Total Karyawan',
    icon: Users,
    color: 'primary' as const,
    getValue: (stats: any) => stats.totalUsers || 0,
    getDescription: (stats: any) => `${stats.approvedUsers || 0} aktif, ${stats.pendingUsers || 0} pending`
  },
  {
    title: 'Hadir Hari Ini',
    icon: CheckCircle,
    color: 'success' as const,
    getValue: (stats: any) => stats.todayPresent || 0,
    getDescription: (stats: any) => `${stats.todayWFH || 0} WFH, ${stats.todayAbsent || 0} tidak hadir`
  },
  {
    title: 'Tugas Selesai',
    icon: CheckCircle,
    color: 'success' as const,
    getValue: (stats: any) => stats.completedTasks || 0,
    getDescription: (stats: any) => `${stats.pendingTasks || 0} dalam progres dari ${stats.totalTasks || 0} total`
  },
  {
    title: 'Izin Pending',
    icon: Clock,
    color: 'warning' as const,
    getValue: (stats: any) => stats.pendingLeaveRequests || 0,
    getDescription: (stats: any) => `${stats.approvedLeaveRequests || 0} disetujui, ${stats.rejectedLeaveRequests || 0} ditolak`
  }
]

export const employeeStatConfigs = [
  {
    title: 'Total Tugas',
    icon: CheckCircle,
    color: 'primary' as const,
    getValue: (stats: any) => stats.totalTasks || 0,
    getDescription: (stats: any) => `${stats.completedTasks || 0} selesai, ${stats.inProgressTasks || 0} dalam progres`
  },
  {
    title: 'Izin Pending',
    icon: Clock,
    color: 'warning' as const,
    getValue: (stats: any) => stats.pendingLeaveRequests || 0,
    getDescription: (stats: any) => `${stats.approvedLeaveRequests || 0} disetujui, ${stats.rejectedLeaveRequests || 0} ditolak`
  },
  {
    title: 'WFH Pending',
    icon: AlertCircle,
    color: 'info' as const,
    getValue: (stats: any) => stats.pendingWFHLogs || 0,
    getDescription: (stats: any) => `${stats.approvedWFHLogs || 0} disetujui, ${stats.rejectedWFHLogs || 0} ditolak`
  },
  {
    title: 'Notifikasi',
    icon: AlertCircle,
    color: 'warning' as const,
    getValue: (stats: any) => stats.unreadNotifications || 0,
    getDescription: (stats: any) => 'notifikasi belum dibaca'
  }
]
