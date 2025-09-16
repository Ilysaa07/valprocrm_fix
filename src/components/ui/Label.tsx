import React from 'react'
import { cn } from '@/lib/utils'

interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

export function Label({ children, htmlFor, className }: LabelProps) {
  return (
    <label 
      htmlFor={htmlFor}
      className={cn('text-sm font-medium text-gray-700', className)}
    >
      {children}
    </label>
  )
}