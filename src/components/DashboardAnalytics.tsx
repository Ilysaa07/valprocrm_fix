'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Activity, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface AnalyticsMetric {
  label: string
  currentValue: number
  previousValue: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  format: 'number' | 'percentage' | 'currency' | 'time'
  unit?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface AnalyticsChart {
  title: string
  subtitle?: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  showLegend?: boolean
  showTotal?: boolean
}

interface DashboardAnalyticsProps {
  title?: string
  metrics: AnalyticsMetric[]
  charts: AnalyticsChart[]
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  onPeriodChange?: (period: string) => void
  className?: string
}

export function DashboardAnalytics({ 
  title = 'Analytics & Trends', 
  metrics, 
  charts,
  period,
  onPeriodChange,
  className = '' 
}: DashboardAnalyticsProps) {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
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

  const getPeriodLabel = (period: string) => {
    const labels = {
      day: 'Hari Ini',
      week: 'Minggu Ini',
      month: 'Bulan Ini',
      quarter: 'Kuartal Ini',
      year: 'Tahun Ini'
    }
    return labels[period as keyof typeof labels] || period
  }

  const renderChart = (chart: AnalyticsChart) => {
    const maxValue = Math.max(...chart.data.map(item => item.value))
    
    switch (chart.type) {
      case 'bar':
        return (
          <div className="space-y-3">
            {chart.data.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.label}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color || 'bg-blue-500'}`}
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                  {formatValue(item.value, 'number')}
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'pie':
        return (
          <div className="flex items-center justify-center space-x-6">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                {chart.data.map((item, index) => {
                  const percentage = (item.value / chart.data.reduce((sum, d) => sum + d.value, 0)) * 100
                  const circumference = 2 * Math.PI * 16
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                  const offset = index === 0 ? 0 : chart.data.slice(0, index).reduce((acc, d) => acc + (d.value / chart.data.reduce((sum, d) => sum + d.value, 0)) * 100, 0) * circumference / 100
                  
                  return (
                    <circle
                      key={index}
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke={item.color || '#3B82F6'}
                      strokeWidth="3"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  )
                })}
              </svg>
              {chart.showTotal && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(chart.data.reduce((sum, item) => sum + item.value, 0), 'number')}
                  </span>
                </div>
              )}
            </div>
            
            {chart.showLegend && (
              <div className="space-y-2">
                {chart.data.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${item.color || 'bg-blue-500'}`}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatValue(item.value, 'number')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="space-y-2">
            {chart.data.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatValue(item.value, 'number')}
                </span>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div className={className}>
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {onPeriodChange && (
            <div className="mt-2">
              <select
                value={period}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>
          )}
        </div>
      )}
      
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-${metric.color}-50 text-${metric.color}-600 border border-${metric.color}-200 mr-3`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatValue(metric.currentValue, metric.format, metric.unit)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {getChangeIcon(metric.changeType)}
                  <span className={`text-xs font-medium ${getChangeColor(metric.changeType)}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                vs {getPeriodLabel(period)}: {formatValue(metric.previousValue, metric.format, metric.unit)}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">{chart.title}</h4>
                {chart.subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{chart.subtitle}</p>
                )}
              </div>
              
              <div className="mt-4">
                {renderChart(chart)}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Predefined analytics configurations
export const adminAnalytics = (stats: any, previousStats?: any) => {
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const getChangeType = (current: number, previous: number): 'increase' | 'decrease' | 'neutral' => {
    if (current > previous) return 'increase'
    if (current < previous) return 'decrease'
    return 'neutral'
  }

  return {
    metrics: [
      {
        label: 'Total Karyawan',
        currentValue: stats.totalUsers || 0,
        previousValue: previousStats?.totalUsers || 0,
        change: calculateChange(stats.totalUsers || 0, previousStats?.totalUsers || 0),
        changeType: getChangeType(stats.totalUsers || 0, previousStats?.totalUsers || 0),
        format: 'number' as const,
        icon: Users,
        color: 'primary' as const
      },
      {
        label: 'Kehadiran',
        currentValue: stats.todayPresent || 0,
        previousValue: previousStats?.todayPresent || 0,
        change: calculateChange(stats.todayPresent || 0, previousStats?.todayPresent || 0),
        changeType: getChangeType(stats.todayPresent || 0, previousStats?.todayPresent || 0),
        format: 'number' as const,
        icon: CheckCircle,
        color: 'success' as const
      },
      {
        label: 'Tugas Selesai',
        currentValue: stats.completedTasks || 0,
        previousValue: previousStats?.completedTasks || 0,
        change: calculateChange(stats.completedTasks || 0, previousStats?.completedTasks || 0),
        changeType: getChangeType(stats.completedTasks || 0, previousStats?.completedTasks || 0),
        format: 'number' as const,
        icon: CheckCircle,
        color: 'success' as const
      },
      {
        label: 'Izin Pending',
        currentValue: stats.pendingLeaveRequests || 0,
        previousValue: previousStats?.pendingLeaveRequests || 0,
        change: calculateChange(stats.pendingLeaveRequests || 0, previousStats?.pendingLeaveRequests || 0),
        changeType: getChangeType(stats.pendingLeaveRequests || 0, previousStats?.pendingLeaveRequests || 0),
        format: 'number' as const,
        icon: Clock,
        color: 'warning' as const
      }
    ],
    charts: [
      {
        title: 'Distribusi Kehadiran',
        subtitle: 'Status kehadiran karyawan hari ini',
        type: 'pie' as const,
        data: [
          { label: 'Hadir', value: stats.todayPresent || 0, color: '#10B981' },
          { label: 'WFH', value: stats.todayWFH || 0, color: '#8B5CF6' },
          { label: 'Tidak Hadir', value: stats.todayAbsent || 0, color: '#EF4444' }
        ],
        showLegend: true,
        showTotal: true
      },
      {
        title: 'Status Tugas',
        subtitle: 'Progress penyelesaian tugas',
        type: 'bar' as const,
        data: [
          { label: 'Selesai', value: stats.completedTasks || 0, color: '#10B981' },
          { label: 'Dalam Progress', value: stats.pendingTasks || 0, color: '#F59E0B' },
          { label: 'Belum Dimulai', value: (stats.totalTasks || 0) - (stats.completedTasks || 0) - (stats.pendingTasks || 0), color: '#6B7280' }
        ],
        showLegend: false,
        showTotal: false
      }
    ]
  }
}

export const employeeAnalytics = (stats: any, previousStats?: any) => {
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const getChangeType = (current: number, previous: number): 'increase' | 'decrease' | 'neutral' => {
    if (current > previous) return 'increase'
    if (current < previous) return 'decrease'
    return 'neutral'
  }

  return {
    metrics: [
      {
        label: 'Total Tugas',
        currentValue: stats.totalTasks || 0,
        previousValue: previousStats?.totalTasks || 0,
        change: calculateChange(stats.totalTasks || 0, previousStats?.totalTasks || 0),
        changeType: getChangeType(stats.totalTasks || 0, previousStats?.totalTasks || 0),
        format: 'number' as const,
        icon: CheckCircle,
        color: 'primary' as const
      },
      {
        label: 'Tugas Selesai',
        currentValue: stats.completedTasks || 0,
        previousValue: previousStats?.completedTasks || 0,
        change: calculateChange(stats.completedTasks || 0, previousStats?.completedTasks || 0),
        changeType: getChangeType(stats.completedTasks || 0, previousStats?.completedTasks || 0),
        format: 'number' as const,
        icon: CheckCircle,
        color: 'success' as const
      },
      {
        label: 'Izin Pending',
        currentValue: stats.pendingLeaveRequests || 0,
        previousValue: previousStats?.pendingLeaveRequests || 0,
        change: calculateChange(stats.pendingLeaveRequests || 0, previousStats?.pendingLeaveRequests || 0),
        changeType: getChangeType(stats.pendingLeaveRequests || 0, previousStats?.pendingLeaveRequests || 0),
        format: 'number' as const,
        icon: Clock,
        color: 'warning' as const
      },
      {
        label: 'Notifikasi',
        currentValue: stats.unreadNotifications || 0,
        previousValue: previousStats?.unreadNotifications || 0,
        change: calculateChange(stats.unreadNotifications || 0, previousStats?.unreadNotifications || 0),
        changeType: getChangeType(stats.unreadNotifications || 0, previousStats?.unreadNotifications || 0),
        format: 'number' as const,
        icon: AlertCircle,
        color: 'info' as const
      }
    ],
    charts: [
      {
        title: 'Progress Tugas',
        subtitle: 'Status penyelesaian tugas Anda',
        type: 'bar' as const,
        data: [
          { label: 'Selesai', value: stats.completedTasks || 0, color: '#10B981' },
          { label: 'Dalam Progress', value: stats.inProgressTasks || 0, color: '#F59E0B' },
          { label: 'Belum Dimulai', value: stats.notStartedTasks || 0, color: '#6B7280' }
        ],
        showLegend: false,
        showTotal: false
      },
      {
        title: 'Status Izin & WFH',
        subtitle: 'Ringkasan status permohonan',
        type: 'pie' as const,
        data: [
          { label: 'Izin Pending', value: stats.pendingLeaveRequests || 0, color: '#F59E0B' },
          { label: 'WFH Pending', value: stats.pendingWFHLogs || 0, color: '#8B5CF6' },
          { label: 'Disetujui', value: (stats.approvedLeaveRequests || 0) + (stats.approvedWFHLogs || 0), color: '#10B981' }
        ],
        showLegend: true,
        showTotal: true
      }
    ]
  }
}
