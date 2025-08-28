'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Activity } from 'lucide-react'

interface ChartSummaryProps {
  title: string
  subtitle?: string
  chartType: 'line' | 'bar' | 'pie' | 'area'
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  total?: number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  changeLabel?: string
  showLegend?: boolean
  className?: string
}

export function ChartSummary({ 
  title, 
  subtitle,
  chartType,
  data,
  total,
  change,
  changeType = 'neutral',
  changeLabel,
  showLegend = true,
  className = '' 
}: ChartSummaryProps) {
  const getChartIcon = () => {
    const icons = {
      line: Activity,
      bar: BarChart3,
      pie: PieChart,
      area: TrendingUp
    }
    return icons[chartType] || Activity
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

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}M`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}jt`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}rb`
    }
    return value.toString()
  }

  const getMaxValue = () => {
    return Math.max(...data.map(item => item.value))
  }

  const getPercentage = (value: number) => {
    const maxValue = getMaxValue()
    if (maxValue === 0) return 0
    return (value / maxValue) * 100
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.label}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color || 'bg-blue-500'}`}
                      style={{ width: `${getPercentage(item.value)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                  {formatValue(item.value)}
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'pie':
        return (
          <div className="flex items-center justify-center space-x-8">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                {data.map((item, index) => {
                  const percentage = getPercentage(item.value)
                  const circumference = 2 * Math.PI * 16
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                  const offset = index === 0 ? 0 : data.slice(0, index).reduce((acc, d) => acc + getPercentage(d.value), 0) * circumference / 100
                  
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
              {total && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(total)}
                  </span>
                </div>
              )}
            </div>
            
            {showLegend && (
              <div className="space-y-2">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${item.color || 'bg-blue-500'}`}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatValue(item.value)}
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
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatValue(item.value)}
                </span>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <Card className={className}>
      <CardBody>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {getChartIcon() && (
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {getChartIcon() && <getChartIcon() className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
              </div>
            )}
            
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
        </div>
        
        <div className="mt-6">
          {renderChart()}
        </div>
        
        {total && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Total: {formatValue(total)}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// Predefined chart configurations
export const attendanceChartConfig = (stats: any) => ({
  title: 'Kehadiran Hari Ini',
  subtitle: 'Ringkasan status kehadiran karyawan',
  chartType: 'pie' as const,
  data: [
    { label: 'Hadir', value: stats.todayPresent || 0, color: '#10B981' },
    { label: 'WFH', value: stats.todayWFH || 0, color: '#8B5CF6' },
    { label: 'Tidak Hadir', value: stats.todayAbsent || 0, color: '#EF4444' }
  ],
  total: stats.totalUsers || 0,
  showLegend: true
})

export const taskProgressChartConfig = (stats: any) => ({
  title: 'Progress Tugas',
  subtitle: 'Status penyelesaian tugas',
  chartType: 'bar' as const,
  data: [
    { label: 'Selesai', value: stats.completedTasks || 0, color: '#10B981' },
    { label: 'Dalam Progress', value: stats.inProgressTasks || 0, color: '#F59E0B' },
    { label: 'Belum Dimulai', value: stats.notStartedTasks || 0, color: '#6B7280' }
  ],
  total: stats.totalTasks || 0,
  showLegend: false
})

export const leaveStatusChartConfig = (stats: any) => ({
  title: 'Status Permohonan Izin',
  subtitle: 'Ringkasan status izin karyawan',
  chartType: 'bar' as const,
  data: [
    { label: 'Pending', value: stats.pendingLeaveRequests || 0, color: '#F59E0B' },
    { label: 'Disetujui', value: stats.approvedLeaveRequests || 0, color: '#10B981' },
    { label: 'Ditolak', value: stats.rejectedLeaveRequests || 0, color: '#EF4444' }
  ],
  total: (stats.pendingLeaveRequests || 0) + (stats.approvedLeaveRequests || 0) + (stats.rejectedLeaveRequests || 0),
  showLegend: false
})
