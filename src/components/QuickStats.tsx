'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { Users, CheckCircle, Clock, AlertCircle, Home, FileText, MapPin, Bell } from 'lucide-react'

interface QuickStatItem {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

interface QuickStatsProps {
  title?: string
  stats: QuickStatItem[]
  layout?: 'grid' | 'list'
  showTrends?: boolean
  className?: string
}

export function QuickStats({ 
  title, 
  stats, 
  layout = 'grid',
  showTrends = false,
  className = '' 
}: QuickStatsProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→'
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  if (layout === 'list') {
    return (
      <Card className={className}>
        <CardBody>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
          )}
          
          <div className="space-y-3">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colorClasses[stat.color]} border`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.label}</p>
                    {stat.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(stat.value)}
                  </span>
                  
                  {showTrends && stat.trend && (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{trendIcons[stat.trend]}</span>
                      {stat.trendValue && (
                        <span className={`text-xs font-medium ${trendColors[stat.trend]}`}>
                          {stat.trendValue}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color]} border mr-3`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatValue(stat.value)}</p>
                    {stat.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                    )}
                  </div>
                </div>
                
                {showTrends && stat.trend && (
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{trendIcons[stat.trend]}</span>
                    {stat.trendValue && (
                      <span className={`text-xs font-medium ${trendColors[stat.trend]}`}>
                        {stat.trendValue}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Predefined quick stats configurations
export const adminQuickStats = (stats: any) => [
  {
    label: 'Total Karyawan',
    value: stats.totalUsers || 0,
    icon: Users,
    color: 'primary' as const,
    description: `${stats.approvedUsers || 0} aktif`
  },
  {
    label: 'Hadir Hari Ini',
    value: stats.todayPresent || 0,
    icon: CheckCircle,
    color: 'success' as const,
    description: `${stats.todayWFH || 0} WFH`
  },
  {
    label: 'Tugas Selesai',
    value: stats.completedTasks || 0,
    icon: CheckCircle,
    color: 'success' as const,
    description: `${stats.pendingTasks || 0} dalam progres`
  },
  {
    label: 'Izin Pending',
    value: stats.pendingLeaveRequests || 0,
    icon: Clock,
    color: 'warning' as const,
    description: 'menunggu persetujuan'
  }
]

export const employeeQuickStats = (stats: any) => [
  {
    label: 'Total Tugas',
    value: stats.totalTasks || 0,
    icon: CheckCircle,
    color: 'primary' as const,
    description: `${stats.completedTasks || 0} selesai`
  },
  {
    label: 'Izin Pending',
    value: stats.pendingLeaveRequests || 0,
    icon: FileText,
    color: 'warning' as const,
    description: 'menunggu persetujuan'
  },
  {
    label: 'WFH Pending',
    value: stats.pendingWFHLogs || 0,
    icon: Home,
    color: 'info' as const,
    description: 'menunggu validasi'
  },
  {
    label: 'Notifikasi',
    value: stats.unreadNotifications || 0,
    icon: Bell,
    color: 'warning' as const,
    description: 'belum dibaca'
  }
]

export const attendanceQuickStats = (stats: any) => [
  {
    label: 'Hadir',
    value: stats.todayPresent || 0,
    icon: CheckCircle,
    color: 'success' as const,
    description: 'karyawan hadir'
  },
  {
    label: 'WFH',
    value: stats.todayWFH || 0,
    icon: Home,
    color: 'info' as const,
    description: 'work from home'
  },
  {
    label: 'Tidak Hadir',
    value: stats.todayAbsent || 0,
    icon: AlertCircle,
    color: 'danger' as const,
    description: 'karyawan absen'
  },
  {
    label: 'Total',
    value: stats.totalUsers || 0,
    icon: Users,
    color: 'primary' as const,
    description: 'karyawan terdaftar'
  }
]

export const taskQuickStats = (stats: any) => [
  {
    label: 'Selesai',
    value: stats.completedTasks || 0,
    icon: CheckCircle,
    color: 'success' as const,
    description: 'tugas selesai'
  },
  {
    label: 'Dalam Progress',
    value: stats.inProgressTasks || 0,
    icon: Clock,
    color: 'warning' as const,
    description: 'sedang dikerjakan'
  },
  {
    label: 'Belum Dimulai',
    value: stats.notStartedTasks || 0,
    icon: AlertCircle,
    color: 'danger' as const,
    description: 'belum dikerjakan'
  },
  {
    label: 'Total',
    value: stats.totalTasks || 0,
    icon: CheckCircle,
    color: 'primary' as const,
    description: 'tugas diberikan'
  }
]
