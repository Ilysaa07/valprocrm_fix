'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
  animated?: boolean
}

export default function ProgressBar({
  progress,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  className,
  animated = true
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={cn('font-medium text-gray-700', labelSizeClasses[size])}>
            {label || 'Progress'}
          </span>
          <span className={cn('text-gray-500', labelSizeClasses[size])}>
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{ 
            width: `${clampedProgress}%`,
            transition: animated ? 'width 0.3s ease-out' : 'none'
          }}
        />
      </div>
    </div>
  )
}

// Specific progress variants
export function UploadProgress({ 
  progress, 
  fileName,
  className 
}: { 
  progress: number
  fileName: string
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 truncate">{fileName}</span>
        <span className="text-gray-500">{Math.round(progress)}%</span>
      </div>
      <ProgressBar 
        progress={progress} 
        variant={progress === 100 ? 'success' : 'default'}
        size="md"
        animated={progress < 100}
      />
    </div>
  )
}

export function DownloadProgress({ 
  progress, 
  fileName,
  className 
}: { 
  progress: number
  fileName: string
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 truncate">{fileName}</span>
        <span className="text-gray-500">{Math.round(progress)}%</span>
      </div>
      <ProgressBar 
        progress={progress} 
        variant={progress === 100 ? 'success' : 'default'}
        size="md"
        animated={progress < 100}
      />
    </div>
  )
}

// Circular progress variant
export function CircularProgress({ 
  progress, 
  size = 'md',
  variant = 'default',
  className 
}: { 
  progress: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string 
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  }

  const strokeWidth = {
    sm: 4,
    md: 6,
    lg: 8
  }

  const radius = {
    sm: 26,
    md: 32,
    lg: 40
  }

  const circumference = 2 * Math.PI * radius[size]
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  const variantColors = {
    default: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500'
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', sizeClasses[size], className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius[size] / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth[size]}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r={radius[size] / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth[size]}
          fill="transparent"
          className={cn('transition-all duration-300 ease-out', variantColors[variant])}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          'font-bold text-gray-700',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>
          {Math.round(clampedProgress)}%
        </span>
      </div>
    </div>
  )
}
