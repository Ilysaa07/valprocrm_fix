'use client'

import React from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileSidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export default function MobileSidebarToggle({ 
  isOpen, 
  onToggle, 
  className = '' 
}: MobileSidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-3 rounded-xl transition-all duration-300 ease-in-out',
        'bg-slate-100 hover:bg-slate-200 active:bg-slate-300',
        'dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2',
        'shadow-sm hover:shadow-md',
        'border border-slate-200 dark:border-slate-600',
        'min-w-[44px] min-h-[44px] flex items-center justify-center',
        className
      )}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      title={isOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-expanded={isOpen}
      aria-controls="mobile-sidebar"
    >
      <div className="relative">
        {isOpen ? (
          <X className="h-5 w-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 rotate-0" />
        ) : (
          <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 rotate-0" />
        )}
        
        {/* Animated indicator */}
        <div className={cn(
          'absolute -top-1 -right-1 w-2 h-2 rounded-full transition-all duration-300',
          isOpen 
            ? 'bg-red-500 scale-100 opacity-100' 
            : 'bg-blue-500 scale-0 opacity-0'
        )} />
      </div>
    </button>
  )
}
