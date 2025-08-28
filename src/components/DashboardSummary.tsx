'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Minus, Users, CheckCircle, Clock, AlertCircle, Home, FileText, MapPin, Bell } from 'lucide-react'

interface SummaryMetric {
  label: string
  value: number
  previousValue?: number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  description?: string
  format?: 'number' | 'currency' | 'percentage' | 'time'
  unit?: string
}

interface DashboardSummaryProps {
  title: string
  subtitle?: string
  metrics: SummaryMetric[]
  layout?: 'grid' | 'list' | 'compact'
  showTrends?: boolean
  showCharts?: boolean
  className?: string
}

export function DashboardSummary({ 
  title, 
  subtitle,
  metrics, 
  layout = 'grid',
  showTrends = true,
  showCharts = false,
  className = '' 
}: DashboardSummaryProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const getChangeType = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'neutral'
  }

  const getChangeIcon = (changeType: 'up' | 'down' | 'neutral') => {
    switch (changeType) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = (changeType: 'up' | 'down' | 'neutral') => {
    switch (changeType) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (value: number, format: string, unit?: string) => {
    let formattedValue = value.toString()
    
    switch (format) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
        break
      case 'percentage':
        formattedValue = `${value}%`
        break
      case 'time':
        if (value >= 60) {
          const hours = Math.floor(value / 60)
          const minutes = value % 60
          formattedValue = `${hours}h ${minutes}m`
        } else {
          formattedValue = `${value}m`
        }
        break
      default:
        if (value >= 1000000) {
          formattedValue = `${(value / 1000000).toFixed(1)}M`
        } else if (value >= 1000) {
          formattedValue = `${(value / 1000).toFixed(1)}K`
        }
        break
    }
    
    return unit ? `${formattedValue} ${unit}` : formattedValue
  }

  const renderMetric = (metric: SummaryMetric, index: number) => {
    const change = metric.previousValue !== undefined ? calculateChange(metric.value, metric.previousValue) : undefined
    const changeType = metric.previousValue !== undefined ? getChangeType(metric.value, metric.previousValue) : 'neutral'
    
    return (
      <Card key={index} className="hover:shadow-lg transition-shadow">
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${colorClasses[metric.color]} border mr-3`}>
                <metric.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatValue(metric.value, metric.format || 'number', metric.unit)}
                </p>
                {metric.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.description}</p>
                )}
              </div>
            </div>
            
            {showTrends && change !== undefined && (
              <div className="flex items-center space-x-1">
                {getChangeIcon(changeType)}
                <span className={`text-sm font-medium ${getChangeColor(changeType)}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>
          
          {showCharts && metric.previousValue !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Previous: {formatValue(metric.previousValue, metric.format || 'number', metric.unit)}</span>
                <span>Current: {formatValue(metric.value, metric.format || 'number', metric.unit)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${changeType === 'up' ? 'bg-green-500' : changeType === 'down' ? 'bg-red-500' : 'bg-gray-500'}`}
                  style={{ 
                    width: `${Math.min(Math.abs(change), 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    )
  }

  if (layout === 'list') {
    return (
      <Card className={className}>
        <CardBody>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="space-y-3">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colorClasses[metric.color]} border`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{metric.label}</p>
                    {metric.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{metric.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(metric.value, metric.format || 'number', metric.unit)}
                  </span>
                  
                  {showTrends && metric.previousValue !== undefined && (
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(getChangeType(metric.value, metric.previousValue))}
                      <span className={`text-xs font-medium ${getChangeColor(getChangeType(metric.value, metric.previousValue))}`}>
                        {calculateChange(metric.value, metric.previousValue)}%
                      </span>
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

  if (layout === 'compact') {
    return (
      <div className={className}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`inline-flex p-2 rounded-lg ${colorClasses[metric.color]} border mb-2`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatValue(metric.value, metric.format || 'number', metric.unit)}
              </p>
              {metric.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => renderMetric(metric, index))}
      </div>
    </div>
  )
}

// Predefined summary configurations
export const adminDashboardSummary = (stats: any, previousStats?: any) => ({
  title: 'Ringkasan Dashboard Admin',
  subtitle: 'Statistik utama sistem',
  metrics: [
    {
      label: 'Total Karyawan',
      value: stats.totalUsers || 0,
      previousValue: previousStats?.totalUsers,
      icon: Users,
      color: 'primary' as const,
      description: `${stats.approvedUsers || 0} aktif`,
      format: 'number' as const
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.todayPresent || 0,
      previousValue: previousStats?.todayPresent,
      icon: CheckCircle,
      color: 'success' as const,
      description: `${stats.todayWFH || 0} WFH`,
      format: 'number' as const
    },
    {
      label: 'Tugas Selesai',
      value: stats.completedTasks || 0,
      previousValue: previousStats?.completedTasks,
      icon: CheckCircle,
      color: 'success' as const,
      description: `${stats.pendingTasks || 0} dalam progres`,
      format: 'number' as const
    },
    {
      label: 'Izin Pending',
      value: stats.pendingLeaveRequests || 0,
      previousValue: previousStats?.pendingLeaveRequests,
      icon: Clock,
      color: 'warning' as const,
      description: 'menunggu persetujuan',
      format: 'number' as const
    }
  ]
})

export const employeeDashboardSummary = (stats: any, previousStats?: any) => ({
  title: 'Ringkasan Dashboard Karyawan',
  subtitle: 'Statistik aktivitas Anda',
  metrics: [
    {
      label: 'Total Tugas',
      value: stats.totalTasks || 0,
      previousValue: previousStats?.totalTasks,
      icon: CheckCircle,
      color: 'primary' as const,
      description: `${stats.completedTasks || 0} selesai`,
      format: 'number' as const
    },
    {
      label: 'Izin Pending',
      value: stats.pendingLeaveRequests || 0,
      previousValue: previousStats?.pendingLeaveRequests,
      icon: FileText,
      color: 'warning' as const,
      description: 'menunggu persetujuan',
      format: 'number' as const
    },
    {
      label: 'WFH Pending',
      value: stats.pendingWFHLogs || 0,
      previousValue: previousStats?.pendingWFHLogs,
      icon: Home,
      color: 'info' as const,
      description: 'menunggu validasi',
      format: 'number' as const
    },
    {
      label: 'Notifikasi',
      value: stats.unreadNotifications || 0,
      previousValue: previousStats?.unreadNotifications,
      icon: Bell,
      color: 'warning' as const,
      description: 'belum dibaca',
      format: 'number' as const
    }
  ]
})
