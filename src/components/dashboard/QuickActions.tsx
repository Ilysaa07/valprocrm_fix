'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { Users, PlusSquare, CheckCircle, BarChart3, Clock, Calendar, CheckSquare, Home } from 'lucide-react'

export interface QuickAction {
  title: string
  description: string
  icon: any
  href: string
  color: string
  badge?: string
}

interface QuickActionsProps {
  actions: QuickAction[]
  title?: string
  className?: string
}

export function QuickActions({ actions, title, className = '' }: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardBody>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <Link
                key={index}
                href={action.href}
                className={`block p-4 rounded-lg border-2 border-transparent hover:border-gray-200 transition-all duration-200 ${action.color} hover:shadow-md`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {action.title}
                      </p>
                      {action.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

// Configuration for admin quick actions
export const adminQuickActions: QuickAction[] = [
  {
    title: 'Kelola Karyawan',
    description: 'Tambah, edit, atau hapus karyawan',
    icon: Users,
    href: '/admin/users',
    color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
  },
  {
    title: 'Buat Tugas',
    description: 'Buat tugas baru untuk karyawan',
    icon: PlusSquare,
    href: '/admin/tasks/create',
    color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
  },
  {
    title: 'Validasi Izin',
    description: 'Review permohonan izin karyawan',
    icon: CheckCircle,
    href: '/admin/leave-requests',
    color: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30',
    badge: 'Pending'
  },
  {
    title: 'Laporan',
    description: 'Lihat laporan kehadiran dan kinerja',
    icon: BarChart3,
    href: '/admin/analytics',
    color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30'
  }
]

// Configuration for employee quick actions
export const employeeQuickActions: QuickAction[] = [
  {
    title: 'Check In/Out',
    description: 'Catat kehadiran hari ini',
    icon: Clock,
    href: '/employee/attendance',
    color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
  },
  {
    title: 'Ajukan Izin',
    description: 'Buat permohonan izin atau cuti',
    icon: Calendar,
    href: '/employee/leave-requests/create',
    color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
  },
  {
    title: 'Lihat Tugas',
    description: 'Lihat dan update tugas Anda',
    icon: CheckSquare,
    href: '/employee/tasks',
    color: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
  },
  {
    title: 'WFH Request',
    description: 'Ajukan kerja dari rumah',
    icon: Home,
    href: '/employee/wfh-requests/create',
    color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30'
  }
]
