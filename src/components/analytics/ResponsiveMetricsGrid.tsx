'use client'

import React from 'react'
import { SmartMetricCard } from './SmartMetricCard'

interface Metric {
  title: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'stable'
  format: 'number' | 'currency' | 'percentage' | 'time'
  icon?: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  onClick?: () => void
  drillDown?: boolean
}

interface ResponsiveMetricsGridProps {
  metrics: Metric[]
  loading?: boolean
  className?: string
}

const MetricsGridSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-pulse shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
        </div>
      </div>
    ))}
  </div>
)

export const ResponsiveMetricsGrid: React.FC<ResponsiveMetricsGridProps> = ({
  metrics,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return <MetricsGridSkeleton count={metrics.length || 6} />
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <SmartMetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          trend={metric.trend}
          format={metric.format}
          icon={metric.icon}
          color={metric.color}
          onClick={metric.onClick}
          drillDown={metric.drillDown}
        />
      ))}
    </div>
  )
}

export default ResponsiveMetricsGrid
