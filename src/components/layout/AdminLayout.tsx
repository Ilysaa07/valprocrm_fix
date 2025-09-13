'use client'

import React from 'react'
import AppLayout from './AppLayout'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  return (
    <AppLayout role="ADMIN" title={title} description={description}>
      {children}
    </AppLayout>
  )
}
