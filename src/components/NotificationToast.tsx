'use client'

import { useEffect, useState } from 'react'
import { X, Bell, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toastVariants = cva(
  'group relative w-full overflow-hidden rounded-lg border p-4 pr-10 shadow-lg transition-all duration-300 flex items-start',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-950 border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50',
        destructive: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-300',
        success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800/30 dark:bg-green-900/20 dark:text-green-300',
        info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-300',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800/30 dark:bg-yellow-900/20 dark:text-yellow-300',
      },
      priority: {
        low: '',
        medium: 'border-l-4',
        high: 'border-l-4 animate-pulse-subtle',
        urgent: 'border-l-4 animate-pulse',
      }
    },
    defaultVariants: {
      variant: 'default',
      priority: 'medium',
    },
    compoundVariants: [
      {
        variant: 'default',
        priority: 'medium',
        className: 'border-l-blue-500 dark:border-l-blue-400',
      },
      {
        variant: 'default',
        priority: 'high',
        className: 'border-l-blue-600 dark:border-l-blue-500',
      },
      {
        variant: 'default',
        priority: 'urgent',
        className: 'border-l-blue-700 dark:border-l-blue-600',
      },
      {
        variant: 'destructive',
        priority: ['medium', 'high', 'urgent'],
        className: 'border-l-red-600 dark:border-l-red-500',
      },
      {
        variant: 'success',
        priority: ['medium', 'high', 'urgent'],
        className: 'border-l-green-600 dark:border-l-green-500',
      },
      {
        variant: 'info',
        priority: ['medium', 'high', 'urgent'],
        className: 'border-l-blue-600 dark:border-l-blue-500',
      },
      {
        variant: 'warning',
        priority: ['medium', 'high', 'urgent'],
        className: 'border-l-yellow-600 dark:border-l-yellow-500',
      },
    ],
  }
)

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  showProgress?: boolean
}

export function Toast({
  className,
  variant,
  priority = 'medium',
  title,
  description,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  showProgress = true,
  ...props
}: ToastProps) {
  const [timeLeft, setTimeLeft] = useState(autoCloseDelay)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted || !autoClose) return

    const timer = setTimeout(() => {
      onClose && onClose()
    }, autoCloseDelay)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval)
          return 0
        }
        return prev - 100
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [autoClose, autoCloseDelay, isMounted, onClose])

  if (!isMounted) return null

  // Icon based on variant
  const IconComponent = {
    default: Bell,
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    destructive: AlertCircle
  }[variant || 'default']

  // Color for the icon based on variant
  const iconColorClass = {
    default: 'text-blue-500 dark:text-blue-400',
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    destructive: 'text-red-600 dark:text-red-400'
  }[variant || 'default']

  return (
    <div
      className={cn(toastVariants({ variant, priority }), className)}
      {...props}
    >
      <div className={cn("mr-3 mt-0.5", iconColorClass)}>
        <IconComponent className="h-5 w-5" />
      </div>
      
      <div className="grid gap-1 flex-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1.5 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      
      {autoClose && showProgress && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-foreground/10 dark:bg-foreground/5">
          <div
            className={cn(
              "h-full transition-all duration-100",
              variant === 'default' ? 'bg-blue-500 dark:bg-blue-400' :
              variant === 'info' ? 'bg-blue-600 dark:bg-blue-500' :
              variant === 'success' ? 'bg-green-600 dark:bg-green-500' :
              variant === 'warning' ? 'bg-yellow-600 dark:bg-yellow-500' :
              variant === 'destructive' ? 'bg-red-600 dark:bg-red-500' :
              'bg-foreground/60'
            )}
            style={{ width: `${(timeLeft / autoCloseDelay) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}