'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Base styles
        'absolute left-4 top-4 z-[9999]',
        'px-4 py-2 rounded-md',
        'bg-accent text-text-inverse',
        'text-sm font-medium',
        'transition-all duration-200',
        // Hidden by default, visible on focus
        'transform -translate-y-16 opacity-0',
        'focus:translate-y-0 focus:opacity-100',
        'focus:outline-none focus:ring-2 focus:ring-accent-light',
        // Ensure it's above everything
        'pointer-events-none focus:pointer-events-auto',
        className
      )}
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.opacity = '1'
      }}
      onBlur={(e) => {
        // Hide the link when focus is lost
        e.currentTarget.style.transform = 'translateY(-4rem)'
        e.currentTarget.style.opacity = '0'
      }}
    >
      {children}
    </a>
  )
}

