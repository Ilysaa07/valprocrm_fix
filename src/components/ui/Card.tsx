"use client"

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-medium ${className}`}>
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
    primary: { icon: 'bg-accent', text: 'text-accent' },
    success: { icon: 'bg-success', text: 'text-success-dark' },
    warning: { icon: 'bg-warning', text: 'text-warning-dark' },
    danger: { icon: 'bg-error', text: 'text-error-dark' },
  }
  const a = accentMap[accent]
  return (
    <Card>
      <CardBody>
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg ${a.icon} text-text-inverse flex items-center justify-center mr-4`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className={`text-2xl font-bold ${a.text}`}>{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

