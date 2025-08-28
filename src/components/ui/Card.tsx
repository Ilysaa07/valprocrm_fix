"use client"

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export function StatCard({
  title,
  value,
  Icon,
  accent = 'primary',
}: {
  title: string
  value: React.ReactNode
  Icon: React.ComponentType<{ className?: string }>
  accent?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const accentMap: Record<string, { icon: string; text: string }> = {
    primary: { icon: 'bg-primary-500', text: 'text-primary-600 dark:text-primary-400' },
    success: { icon: 'bg-secondary-500', text: 'text-secondary-600 dark:text-secondary-400' },
    warning: { icon: 'bg-accent-500', text: 'text-accent-600 dark:text-accent-400' },
    danger: { icon: 'bg-danger-500', text: 'text-danger-600 dark:text-danger-400' },
  }
  const a = accentMap[accent]
  return (
    <Card>
      <CardBody>
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg ${a.icon} text-white flex items-center justify-center mr-4`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</p>
            <p className={`text-2xl font-bold ${a.text}`}>{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

