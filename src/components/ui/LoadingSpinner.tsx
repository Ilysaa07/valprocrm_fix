'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const variantClasses = {
    default: 'text-gray-400',
    primary: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeClasses[size],
      variantClasses[variant],
      className || ''
    )} />
  )
}

// Pulse loading variant
export function LoadingPulse({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-6 h-6'
  }

  const variantClasses = {
    default: 'bg-gray-400',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }

  return (
    <div className="flex space-x-1">
      <div className={cn(
        'animate-pulse rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className || ''
      )} />
      <div className={cn(
        'animate-pulse rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className || ''
      )} />
      <div className={cn(
        'animate-pulse rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className || ''
      )} />
    </div>
  )
}

// Skeleton loading variant
export function LoadingSkeleton({ 
  className,
  lines = 3 
}: { 
  className?: string
  lines?: number 
}) {
  return (
    <div className={cn('space-y-3', className || '')}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            index === 0 ? 'h-4 w-3/4' : 'h-3 w-full',
            index === lines - 1 ? 'w-1/2' : ''
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  )
}

// Document loading skeleton
export function DocumentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

// Card loading skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className || '')}>
      <div className="bg-gray-200 dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
        <div className="space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-neutral-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
