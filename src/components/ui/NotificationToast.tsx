'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'

interface NotificationToastProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  className?: string
  showIcon?: boolean
  showCloseButton?: boolean
}

export default function NotificationToast({
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  className,
  showIcon = true,
  showCloseButton = true
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    }
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
        config.bgColor,
        config.borderColor,
        isExiting ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0',
        className
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-current opacity-20 animate-pulse">
          <div 
            className="h-full bg-current transition-all duration-300 ease-linear"
            style={{ 
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {showIcon && (
          <IconComponent className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-medium', config.textColor)}>
            {title}
          </h4>
          {message && (
            <p className={cn('mt-1 text-sm opacity-90', config.textColor)}>
              {message}
            </p>
          )}
        </div>

        {showCloseButton && (
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/10',
              config.textColor
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
