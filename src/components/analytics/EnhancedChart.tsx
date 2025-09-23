'use client'

import React, { useState } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Download, Maximize2, Minimize2 } from 'lucide-react'

interface ChartData {
  label: string
  value: number
  color?: string
}

interface EnhancedChartProps {
  title: string
  subtitle?: string
  type: 'bar' | 'pie' | 'line' | 'area'
  data: ChartData[]
  showLegend?: boolean
  showTotal?: boolean
  onExport?: () => void
  onDrillDown?: (data: ChartData) => void
  loading?: boolean
  className?: string
}

const ChartSkeleton: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardBody>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    </CardBody>
  </Card>
)

const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

const renderBarChart = (data: ChartData[], onDrillDown?: (data: ChartData) => void) => {
  // Normalize values to safe non-negative finite numbers
  const normalizedValues = data.map((item) => {
    const numeric = Number(item.value)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
  })

  const maxValue = normalizedValues.reduce((max, v) => (v > max ? v : max), 0)

  // Empty-state: all values are zero
  if (maxValue === 0) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-2 rounded-lg transition-colors"
          >
            <div className="w-20 sm:w-24 text-sm text-gray-700 dark:text-gray-300 truncate">
              {item.label}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300 bg-gray-300 dark:bg-gray-500"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-900 dark:text-gray-50 text-right">
              {formatValue(Number(item.value) || 0)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = normalizedValues[index]
        // Ensure bars are visible for very small non-zero values
        const rawPercent = (value / maxValue) * 100
        const widthPercent = value > 0 ? Math.min(100, Math.max(6, rawPercent)) : 0
        return (
          <div
            key={index}
            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              onDrillDown ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : ''
            }`}
            onClick={() => onDrillDown?.(item)}
          >
            <div className="w-20 sm:w-24 text-sm text-gray-700 dark:text-gray-300 truncate">
              {item.label}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${item.color || 'bg-blue-500'}`}
                  style={{ width: `${widthPercent}%` }}
                  title={`${value}`}
                ></div>
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-900 dark:text-gray-50 text-right">
              {formatValue(value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const renderPieChart = (data: ChartData[], showTotal?: boolean, showLegend?: boolean) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // Handle empty data case
  if (total === 0) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
              className="dark:stroke-gray-600"
            />
          </svg>
          {showTotal && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-50">
                0
              </span>
            </div>
          )}
        </div>
        
        {showLegend && (
          <div className="space-y-2 min-w-0 flex-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${item.color || 'bg-blue-500'}`}
                ></div>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
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
  }
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const circumference = 2 * Math.PI * 16
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const offset = index === 0 ? 0 : data.slice(0, index).reduce((acc, d) => acc + (d.value / total) * 100, 0) * circumference / 100
            
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
                className="transition-all duration-300"
              />
            )
          })}
        </svg>
        {showTotal && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-50">
              {formatValue(total)}
            </span>
          </div>
        )}
      </div>
      
      {showLegend && (
        <div className="space-y-2 min-w-0 flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${item.color || 'bg-blue-500'}`}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
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
}

export const EnhancedChart: React.FC<EnhancedChartProps> = ({
  title,
  subtitle,
  type,
  data,
  showLegend = true,
  showTotal = false,
  onExport,
  onDrillDown,
  loading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (loading) {
    return <ChartSkeleton />
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart(data, onDrillDown)
      case 'pie':
        return renderPieChart(data, showTotal, showLegend)
      default:
        return renderBarChart(data, onDrillDown)
    }
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardBody>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-50 truncate">
              {title}
            </h4>
            {subtitle && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={isExpanded ? 'Minimize chart' : 'Maximize chart'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Export chart"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Chart Content */}
        <div className={`transition-all duration-300 ${isExpanded ? 'scale-105' : ''}`}>
          {renderChart()}
        </div>
      </CardBody>
    </Card>
  )
}

export default EnhancedChart
