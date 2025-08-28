'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: LucideIcon
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  badge?: string | number
}

interface QuickActionsProps {
  title: string
  actions: QuickAction[]
  className?: string
}

export function QuickActions({ title, actions, className = '' }: QuickActionsProps) {
  const colorClasses = {
    primary: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600',
    success: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-600',
    warning: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-600',
    danger: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600',
    info: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600'
  }

  const iconColorClasses = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-purple-600'
  }

  return (
    <Card className={className}>
      <CardBody>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div
                className={`flex items-center p-3 rounded-lg border transition-colors ${colorClasses[action.color]}`}
              >
                <action.icon className={`h-5 w-5 mr-3 ${iconColorClasses[action.color]}`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                {action.badge && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-white ${iconColorClasses[action.color]}`}>
                    {action.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

// Predefined quick action configurations
export const adminQuickActions = (stats: any) => [
  {
    title: 'Persetujuan Registrasi',
    description: `${stats.pendingUsers || 0} karyawan menunggu persetujuan`,
    href: '/admin/users/pending',
    icon: require('lucide-react').AlertCircle,
    color: 'warning' as const,
    badge: stats.pendingUsers || 0
  },
  {
    title: 'Manajemen Izin',
    description: `${stats.pendingLeaveRequests || 0} permohonan izin menunggu`,
    href: '/admin/leave-requests',
    icon: require('lucide-react').FileText,
    color: 'primary' as const,
    badge: stats.pendingLeaveRequests || 0
  },
  {
    title: 'Validasi WFH',
    description: `${stats.pendingWFHLogs || 0} log WFH menunggu validasi`,
    href: '/admin/wfh/validation',
    icon: require('lucide-react').Home,
    color: 'info' as const,
    badge: stats.pendingWFHLogs || 0
  },
  {
    title: 'Pengaturan Lokasi',
    description: 'Atur lokasi dan radius kantor',
    href: '/admin/attendance',
    icon: require('lucide-react').MapPin,
    color: 'success' as const
  }
]

export const employeeQuickActions = (stats: any) => [
  {
    title: 'Absensi',
    description: 'Clock in/out dan lihat status hari ini',
    href: '/employee/attendance',
    icon: require('lucide-react').MapPin,
    color: 'primary' as const
  },
  {
    title: 'Pengajuan Izin',
    description: `${stats.pendingLeaveRequests || 0} permohonan pending`,
    href: '/employee/leave-requests',
    icon: require('lucide-react').FileText,
    color: 'warning' as const,
    badge: stats.pendingLeaveRequests || 0
  },
  {
    title: 'Lapor WFH',
    description: `${stats.pendingWFHLogs || 0} log pending validasi`,
    href: '/employee/wfh',
    icon: require('lucide-react').Home,
    color: 'info' as const,
    badge: stats.pendingWFHLogs || 0
  },
  {
    title: 'Kalender Absensi',
    description: 'Lihat riwayat kehadiran bulanan',
    href: '/employee/attendance/calendar',
    icon: require('lucide-react').Calendar,
    color: 'success' as const
  }
]
