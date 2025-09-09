'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// ========================================
// LAYOUT COMPONENTS
// ========================================

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className = '' }: DashboardLayoutProps) {
  return (
    <div className={cn(
      'min-h-screen bg-slate-50 dark:bg-slate-900',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4 lg:py-6 space-y-4 lg:space-y-6">
        {children}
      </div>
    </div>
  )
}

interface DashboardSectionProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showTitle?: boolean
  className?: string
}

export function DashboardSection({ 
  children, 
  title, 
  subtitle, 
  showTitle = true, 
  className = '' 
}: DashboardSectionProps) {
  return (
    <section className={`space-y-3 lg:space-y-4 ${className}`}>
      {showTitle && title && (
        <div className="flex items-center space-x-3 mb-3 lg:mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}

interface DashboardGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DashboardGrid({ 
  children, 
  cols = 3, 
  gap = 'md', 
  className = '' 
}: DashboardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  const gridGaps = {
    sm: 'gap-3 lg:gap-4',
    md: 'gap-3 lg:gap-4',
    lg: 'gap-4 lg:gap-6'
  }

  return (
    <div className={cn(
      'grid',
      gridCols[cols],
      gridGaps[gap],
      className
    )}>
      {children}
    </div>
  )
}

// ========================================
// SIDEBAR & MAIN LAYOUT
// ========================================

interface DashboardSidebarProps {
  children: React.ReactNode
  className?: string
}

export function DashboardSidebar({ children, className = '' }: DashboardSidebarProps) {
  return (
    <aside className={cn(
      'w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700',
      'p-6 space-y-6',
      className
    )}>
      {children}
    </aside>
  )
}

interface DashboardMainProps {
  children: React.ReactNode
  className?: string
}

export function DashboardMain({ children, className = '' }: DashboardMainProps) {
  return (
    <main className={cn(
      'flex-1 p-6 space-y-6',
      className
    )}>
      {children}
    </main>
  )
}

// ========================================
// COLUMN LAYOUTS
// ========================================

interface TwoColumnLayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  className?: string
}

export function TwoColumnLayout({ sidebar, main, className = '' }: TwoColumnLayoutProps) {
  return (
    <div className={cn(
      'flex min-h-screen bg-slate-50 dark:bg-slate-900',
      className
    )}>
      {sidebar}
      {main}
    </div>
  )
}

interface ThreeColumnLayoutProps {
  leftSidebar: React.ReactNode
  main: React.ReactNode
  rightSidebar: React.ReactNode
  className?: string
}

export function ThreeColumnLayout({ leftSidebar, main, rightSidebar, className = '' }: ThreeColumnLayoutProps) {
  return (
    <div className={cn(
      'flex min-h-screen bg-slate-50 dark:bg-slate-900',
      className
    )}>
      {leftSidebar}
      {main}
      {rightSidebar}
    </div>
  )
}

interface FourColumnLayoutProps {
  leftSidebar: React.ReactNode
  main: React.ReactNode
  rightSidebar: React.ReactNode
  farRightSidebar: React.ReactNode
  className?: string
}

export function FourColumnLayout({ leftSidebar, main, rightSidebar, farRightSidebar, className = '' }: FourColumnLayoutProps) {
  return (
    <div className={cn(
      'flex min-h-screen bg-slate-50 dark:bg-slate-900',
      className
    )}>
      {leftSidebar}
      {main}
      {rightSidebar}
      {farRightSidebar}
    </div>
  )
}

// ========================================
// CARD COMPONENTS
// ========================================

interface DashboardCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function DashboardCard({ 
  children, 
  className = '', 
  padding = 'md',
  hover = true
}: DashboardCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={cn(
      'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700',
      'shadow-sm',
      paddingClasses[padding],
      hover && 'hover:shadow-lg transition-shadow duration-200',
      className
    )}>
      {children}
    </div>
  )
}

interface DashboardStatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  className?: string
}

export function DashboardStatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className = '' 
}: DashboardStatCardProps) {
  return (
    <DashboardCard className={cn('relative overflow-hidden', className)}>
      {Icon && (
        <div className="absolute top-4 right-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center space-x-2 pt-2">
            <span className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {trend.period}
            </span>
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

interface DashboardMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  className?: string
}

export function DashboardMetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  className = '' 
}: DashboardMetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white'
  }

  return (
    <DashboardCard className={cn('text-center', className)}>
      {Icon && (
        <div className={cn(
          'w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center',
          colorClasses[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </DashboardCard>
  )
}
