import React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  className?: string
  onValueChange?: (value: string) => void
}

export function Select({ children, className, onValueChange, onChange, ...props }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value)
    }
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        className
      )}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  )
}
