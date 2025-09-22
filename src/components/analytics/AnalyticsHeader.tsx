'use client'

import React from 'react'
import { RefreshCw, Clock, Download, Settings } from 'lucide-react'

interface AnalyticsHeaderProps {
  title?: string
  subtitle?: string
  lastUpdated?: Date
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  onRefresh: () => void
  onExport?: () => void
  onSettings?: () => void
  loading?: boolean
  className?: string
}

const periodOptions = [
  { value: '7d', label: '7 Hari' },
  { value: '30d', label: '30 Hari' },
  { value: '90d', label: '90 Hari' },
  { value: '1y', label: '1 Tahun' }
]

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  title = 'Analytics Dashboard',
  subtitle = 'Ringkasan performa sistem dan karyawan secara real-time',
  lastUpdated = new Date(),
  selectedPeriod,
  onPeriodChange,
  onRefresh,
  onExport,
  onSettings,
  loading = false,
  className = ''
}) => {
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Mobile-optimized header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-2 h-12 bg-gradient-to-b from-blue-500 via-green-500 to-purple-500 rounded-full shadow-lg"></div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Controls - Mobile optimized */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Period Selector */}
          <div className="flex-1 sm:flex-none">
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={loading}
            >
              {periodOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {option.label} Terakhir
                </option>
              ))}
            </select>
          </div>
          
          {/* Last Updated */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">
              Terakhir diupdate: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            {/* Export Button */}
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                aria-label="Export data"
              >
                <Download className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            
            {/* Settings Button */}
            {onSettings && (
              <button
                onClick={onSettings}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsHeader
