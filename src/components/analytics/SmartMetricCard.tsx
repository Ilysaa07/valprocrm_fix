'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'

interface SmartMetricCardProps {
  title: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'stable'
  format: 'number' | 'currency' | 'percentage' | 'time'
  icon?: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  onClick?: () => void
  drillDown?: boolean
  loading?: boolean
  className?: string
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-300 dark:hover:border-blue-600'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    hover: 'hover:border-green-300 dark:hover:border-green-600'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    hover: 'hover:border-yellow-300 dark:hover:border-yellow-600'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    hover: 'hover:border-red-300 dark:hover:border-red-600'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-300 dark:hover:border-purple-600'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
    hover: 'hover:border-gray-300 dark:hover:border-gray-600'
  }
}

const formatValue = (value: number | string, format: string): string => {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'percentage':
      return `${value}%`
    case 'time':
      if (value >= 60) {
        const hours = Math.floor(value / 60)
        const minutes = value % 60
        return `${hours}h ${minutes}m`
      } else {
        return `${value}m`
      }
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toString()
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
    default:
      return <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
  }
}

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up':
      return 'text-green-600 dark:text-green-400'
    case 'down':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-pulse shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
    </div>
    <div className="flex items-baseline justify-between">
      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
    </div>
  </div>
)

export const SmartMetricCard: React.FC<SmartMetricCardProps> = ({
  title,
  value,
  change,
  trend,
  format,
  icon: Icon,
  color = 'blue',
  onClick,
  drillDown = false,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return <MetricCardSkeleton />
  }

  const colorScheme = colorClasses[color]
  const isClickable = onClick || drillDown

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200
        p-4 sm:p-6 hover:shadow-lg
        ${colorScheme.border}
        ${isClickable ? `cursor-pointer hover:scale-[1.02] ${colorScheme.hover}` : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
      aria-label={isClickable ? `${title}: ${formatValue(value, format)}` : undefined}
    >
      {/* Header with icon and trend */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {Icon && (
            <div className={`p-2 rounded-lg ${colorScheme.bg} ${colorScheme.border} border`}>
              <Icon className={`w-4 h-4 ${colorScheme.icon}`} />
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {title}
          </h3>
        </div>
        {getTrendIcon(trend)}
      </div>
      
      {/* Value and change */}
      <div className="flex items-baseline justify-between">
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {formatValue(value, format)}
        </p>
        <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
      
      {/* Drill down indicator */}
      {drillDown && (
        <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-300">
          <span>Click to view details</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      )}
    </div>
  )
}

export default SmartMetricCard
