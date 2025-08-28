'use client'

import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

interface DashboardSectionProps {
  title?: string
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

interface DashboardGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

interface DashboardSidebarProps {
  children: ReactNode
  className?: string
}

interface DashboardMainProps {
  children: ReactNode
  className?: string
}

export function DashboardLayout({ children, className = '' }: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-primary-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800/90 transition-colors duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
        {children}
      </div>
    </div>
  )
}

export function DashboardSection({ title, children, className = '', fullWidth = false }: DashboardSectionProps) {
  return (
    <section className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {title && (
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">{title}</h2>
          </div>
        </div>
      )}
      {children}
    </section>
  )
}

export function DashboardGrid({ children, cols = 2, gap = 'md', className = '' }: DashboardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const gridGaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={`grid ${gridCols[cols]} ${gridGaps[gap]} auto-rows-fr ${className}`}>
      {children}
    </div>
  )
}

export function DashboardSidebar({ children, className = '' }: DashboardSidebarProps) {
  return (
    <aside className={`lg:w-80 ${className}`}>
      {children}
    </aside>
  )
}

export function DashboardMain({ children, className = '' }: DashboardMainProps) {
  return (
    <main className={`flex-1 ${className}`}>
      {children}
    </main>
  )
}

// Predefined dashboard layouts
export function TwoColumnLayout({ 
  children,
  className = '' 
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${className}`}>
      {children}
    </div>
  )
}

export function ThreeColumnLayout({ 
  leftSidebar, 
  main, 
  rightSidebar,
  leftWidth = 'w-64',
  rightWidth = 'w-80',
  className = '' 
}: {
  leftSidebar: ReactNode
  main: ReactNode
  rightSidebar: ReactNode
  leftWidth?: string
  rightWidth?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      <aside className={`lg:${leftWidth} order-2 lg:order-1`}>
        {leftSidebar}
      </aside>
      <main className="flex-1 order-1 lg:order-2">
        {main}
      </main>
      <aside className={`lg:${rightWidth} order-3 lg:order-3`}>
        {rightSidebar}
      </aside>
    </div>
  )
}

export function MasonryLayout({ 
  children, 
  columns = 3,
  className = '' 
}: {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  const columnClasses = {
    2: 'columns-1 md:columns-2',
    3: 'columns-1 md:columns-2 lg:columns-3',
    4: 'columns-1 md:columns-2 lg:columns-3 xl:columns-4'
  }

  return (
    <div className={`${columnClasses[columns]} gap-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardGrid({ 
  children, 
  cols = 4,
  gap = 'md',
  className = '' 
}: {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <DashboardGrid cols={cols} gap={gap} className={className}>
      {children}
    </DashboardGrid>
  )
}

export function StatsGrid({ 
  children, 
  className = '' 
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <DashboardGrid cols={4} gap="md" className={className}>
      {children}
    </DashboardGrid>
  )
}

export function ContentGrid({ 
  children, 
  className = '' 
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <DashboardGrid cols={2} gap="lg" className={className}>
      {children}
    </DashboardGrid>
  )
}

export function SidebarLayout({ 
  sidebar, 
  main,
  className = '' 
}: {
  sidebar: ReactNode
  main: ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${className}`}>
      <div>{sidebar}</div>
      <div>{main}</div>
    </div>
  )
}

// Utility components for common dashboard patterns
export function DashboardHeader({ 
  title, 
  subtitle,
  actions,
  className = '' 
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="w-2 h-10 bg-gradient-to-b from-primary-500 via-secondary-500 to-accent-500 rounded-full shadow-lg"></div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 via-secondary-600 to-accent-600 dark:from-primary-400 dark:via-secondary-400 dark:to-accent-400 bg-clip-text text-transparent">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="mt-6 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export function DashboardFooter({ 
  children, 
  className = '' 
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <footer className={`mt-16 pt-8 border-t border-neutral-200/50 dark:border-neutral-700/50 ${className}`}>
      {children}
    </footer>
  )
}

export function DashboardEmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  className = '' 
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="relative inline-block">
        <Icon className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-xl"></div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">{description}</p>
      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  )
}
