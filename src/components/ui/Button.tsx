import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  loading?: boolean
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  loading = false,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 focus:ring-offset-white dark:focus:ring-offset-gray-900'
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100',
    link: 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  }
  
  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      aria-busy={loading || undefined}
      {...props}
    />
  )
}

// Default export for backward compatibility
export default Button