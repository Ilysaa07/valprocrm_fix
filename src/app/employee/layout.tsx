import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Employee Dashboard - Valpro Intertech',
  description: 'Employee portal for task management, attendance tracking, and workplace collaboration',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366f1',
}

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
