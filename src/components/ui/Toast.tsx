'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'

interface ToastProps {
  message: string
  title?: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'analytics' | 'realtime'
  category?: 'task' | 'user' | 'finance' | 'attendance' | 'system' | 'chat'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  timestamp?: string
  analytics?: {
    count?: number
    trend?: 'up' | 'down' | 'stable'
    percentage?: number
  }
}

export default function Toast({ 
  message, 
  title = 'Notifikasi', 
  type = 'info',
  category,
  priority = 'medium',
  actionUrl,
  timestamp,
  analytics
}: ToastProps) {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Animasi masuk
    const showTimer = setTimeout(() => setVisible(true), 50)
    
    // Progress bar animation
    const duration = priority === 'urgent' ? 8000 : type === 'error' ? 6000 : 4000
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - (100 / (duration / 50))
      })
    }, 50)
    
    return () => {
      clearTimeout(showTimer)
      clearInterval(interval)
    }
  }, [])

  const bgColors: Record<string, string> = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-500 dark:text-green-200',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-800 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-500 dark:text-red-200',
    warning: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400 text-yellow-800 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-500 dark:text-yellow-200',
    info: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-400 text-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-500 dark:text-blue-200',
    analytics: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-400 text-purple-800 dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-purple-500 dark:text-purple-200',
    realtime: 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-400 text-orange-800 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-500 dark:text-orange-200',
  }

  const priorityColors: Record<string, string> = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-500',
    high: 'border-l-orange-500',
    urgent: 'border-l-red-600 animate-pulse',
  }

  const categoryIcons: Record<string, React.ReactElement> = {
    task: <CheckCircle className="h-5 w-5" />,
    user: <Users className="h-5 w-5" />,
    finance: <DollarSign className="h-5 w-5" />,
    attendance: <Calendar className="h-5 w-5" />,
    system: <Bell className="h-5 w-5" />,
    chat: <Bell className="h-5 w-5" />,
  }

  const icons: Record<string, React.ReactElement> = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    analytics: <TrendingUp className="h-5 w-5 text-purple-500" />,
    realtime: <Bell className="h-5 w-5 text-orange-500" />,
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className={`w-80 max-w-full shadow-xl rounded-xl border-l-4 overflow-hidden transition-all duration-500 transform backdrop-blur-sm
        ${bgColors[type]}
        ${priorityColors[priority]}
        ${visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-full scale-95'}
      `}
    >
      {/* Progress bar */}
      <div className="h-1 bg-black/10 dark:bg-white/10">
        <div 
          className={`h-full transition-all duration-100 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            type === 'analytics' ? 'bg-purple-500' :
            type === 'realtime' ? 'bg-orange-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {category ? categoryIcons[category] || icons[type] : icons[type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold truncate">{title}</p>
              <div className="flex items-center space-x-2">
                {priority === 'urgent' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-full">
                    URGENT
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(timestamp)}
                </span>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed">{message}</p>
            
            {/* Analytics data */}
            {analytics && (
              <div className="mt-2 flex items-center space-x-4 text-xs">
                {analytics.count && (
                  <span className="flex items-center space-x-1">
                    <span className="font-medium">{analytics.count}</span>
                    <span className="text-gray-500 dark:text-gray-400">items</span>
                  </span>
                )}
                {analytics.trend && analytics.percentage && (
                  <span className={`flex items-center space-x-1 ${
                    analytics.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                    analytics.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${
                      analytics.trend === 'down' ? 'rotate-180' : ''
                    }`} />
                    <span className="font-medium">{analytics.percentage}%</span>
                  </span>
                )}
              </div>
            )}
            
            {/* Action button */}
            {actionUrl && (
              <div className="mt-3">
                <a 
                  href={actionUrl}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/30 rounded-lg transition-colors"
                >
                  Lihat Detail
                </a>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
