'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  variant?: 'default' | 'light'
}

export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  className,
  variant = 'default'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const tooltipVariants = cva(
    'absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg whitespace-nowrap',
    {
      variants: {
        variant: {
          default: 'bg-gray-800 dark:bg-neutral-900 text-white',
          light: 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 border border-gray-200 dark:border-neutral-700',
        },
      },
      defaultVariants: {
        variant: 'default',
      },
    }
  )

  return (
    <div 
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div
          className={cn(
            tooltipVariants({ variant }),
            positionClasses[position],
            'transition-opacity duration-200'
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Specific tooltip variants
export function InfoTooltip({ 
  content, 
  children, 
  className 
}: { 
  content: ReactNode
  children: ReactNode
  className?: string 
}) {
  return (
    <Tooltip 
      content={content} 
      position="top"
      className={cn('max-w-xs', className || '')}
    >
      {children}
    </Tooltip>
  )
}

export function HelpTooltip({ 
  content, 
  children, 
  className 
}: { 
  content: ReactNode
  children: ReactNode
  className?: string 
}) {
  return (
    <Tooltip 
      content={content} 
      position="top"
      className={cn('max-w-sm', className || '')}
    >
      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-help">
        {children}
      </div>
    </Tooltip>
  )
}
