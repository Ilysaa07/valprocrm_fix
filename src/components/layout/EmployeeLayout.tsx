"use client"

import React from 'react'
import AppLayout from './AppLayout'

interface EmployeeLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function EmployeeLayout({ children, title, description }: EmployeeLayoutProps) {
  return (
    <AppLayout role="EMPLOYEE" title={title} description={description}>
      <div className="px-3 sm:px-0">
        {children}
      </div>
    </AppLayout>
  )
}

