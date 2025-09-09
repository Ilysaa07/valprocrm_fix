'use client'

import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variantStyles = {
    default: 'bg-surface text-text-primary',
    success: 'bg-success/20 text-success-dark',
    warning: 'bg-warning/20 text-warning-dark',
    danger: 'bg-error/20 text-error-dark',
    info: 'bg-accent/20 text-accent-dark',
    secondary: 'bg-surface text-text-secondary',
    outline: 'bg-card text-text-primary border border-border',
    destructive: 'bg-error/20 text-error-dark'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span
      className={`
        ${baseClasses}
        ${variantStyles[variant]}
        ${sizeClasses[size]}
        ${className || ''}
      `}
    >
      {children}
    </span>
  )
}

