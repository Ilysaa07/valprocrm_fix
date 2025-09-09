'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, XCircle, Bell } from 'lucide-react'

interface NotificationToastProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  className?: string
  showIcon?: boolean
  showCloseButton?: boolean
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  category?: 'task' | 'user' | 'finance' | 'attendance' | 'system' | 'chat'
}

export default function NotificationToast({
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  className,
  showIcon = true,
  showCloseButton = true,
  priority = 'medium',
  actionUrl,
  category
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration > 0) {
      // Progress bar animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100))
          return newProgress <= 0 ? 0 : newProgress
        })
      }, 100)

      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
      }
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  const handleClick = () => {
    if (actionUrl) {
      window.open(actionUrl, '_blank')
    }
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-gradient-to-r from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-900',
      accentColor: 'bg-emerald-500',
      shadowColor: 'shadow-emerald-100'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-gradient-to-r from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      accentColor: 'bg-red-500',
      shadowColor: 'shadow-red-100'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-500',
      bgColor: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      accentColor: 'bg-amber-500',
      shadowColor: 'shadow-amber-100'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      accentColor: 'bg-blue-500',
      shadowColor: 'shadow-blue-100'
    }
  }

  const priorityConfig = {
    low: 'border-l-2',
    medium: 'border-l-4',
    high: 'border-l-4 shadow-lg',
    urgent: 'border-l-4 shadow-xl animate-pulse'
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-500 ease-out cursor-pointer',
        'hover:scale-105 hover:shadow-xl active:scale-95',
        config.bgColor,
        config.borderColor,
        config.shadowColor,
        priorityConfig[priority],
        isExiting 
          ? 'opacity-0 scale-90 translate-x-full' 
          : 'opacity-100 scale-100 translate-x-0 animate-slideInFromRight',
        actionUrl && 'hover:bg-opacity-80',
        className
      )}
      onClick={handleClick}
      style={{
        borderLeftColor: typeConfig[type].iconColor.replace('text-', '').replace('-500', '')
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 h-1 w-full bg-black/5">
          <div 
            className={cn('h-full transition-all duration-100 ease-linear', config.accentColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Priority indicator */}
      {priority === 'urgent' && (
        <div className="absolute top-2 right-2">
          <Bell className="w-4 h-4 text-red-500 animate-bounce" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {showIcon && (
            <div className="flex-shrink-0">
              <div className={cn(
                'rounded-full p-2 transition-transform duration-300 group-hover:scale-110',
                config.iconColor.replace('text-', 'bg-').replace('-500', '-100')
              )}>
                <IconComponent className={cn('w-5 h-5', config.iconColor)} />
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={cn('font-semibold text-sm', config.textColor)}>
                {title}
              </h4>
              {category && (
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  config.textColor.replace('text-', 'bg-').replace('-900', '-100'),
                  config.textColor
                )}>
                  {category}
                </span>
              )}
            </div>
            {message && (
              <p className={cn('mt-1 text-sm opacity-80 leading-relaxed', config.textColor)}>
                {message}
              </p>
            )}
            {actionUrl && (
              <div className="mt-2">
                <span className={cn('text-xs font-medium underline', config.textColor)}>
                  Klik untuk melihat detail
                </span>
              </div>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className={cn(
                'flex-shrink-0 rounded-full p-1.5 transition-all duration-200',
                'hover:bg-black/10 active:bg-black/20 hover:scale-110',
                config.textColor
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-active:opacity-100 group-active:animate-ping transition-opacity duration-150" />
      </div>
    </div>
  )
}

// Toast container for managing multiple toasts
export function ToastContainer({ 
  toasts, 
  onRemoveToast,
  className 
}: { 
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
  }>
  onRemoveToast: (id: string) => void
  className?: string 
}) {
  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 space-y-3 max-w-sm',
      className
    )}>
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Specific toast variants
export function SuccessToast({ 
  title, 
  message, 
  ...props 
}: Omit<NotificationToastProps, 'type'>) {
  return (
    <NotificationToast
      type="success"
      title={title}
      message={message}
      {...props}
    />
  )
}

export function ErrorToast({ 
  title, 
  message, 
  ...props 
}: Omit<NotificationToastProps, 'type'>) {
  return (
    <NotificationToast
      type="error"
      title={title}
      message={message}
      {...props}
    />
  )
}

export function WarningToast({ 
  title, 
  message, 
  ...props 
}: Omit<NotificationToastProps, 'type'>) {
  return (
    <NotificationToast
      type="warning"
      title={title}
      message={message}
      {...props}
    />
  )
}

export function InfoToast({ 
  title, 
  message, 
  ...props 
}: Omit<NotificationToastProps, 'type'>) {
  return (
    <NotificationToast
      type="info"
      title={title}
      message={message}
      {...props}
    />
  )
}
