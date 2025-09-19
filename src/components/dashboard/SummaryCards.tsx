'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { Users, UserPlus, Eye, CheckSquare, Plus, Calendar, BarChart3, Clock } from 'lucide-react'

export interface SummaryCard {
  title: string
  value: string | number
  description: string
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  actions?: {
    label: string
    href: string
    icon: any
  }[]
}

interface SummaryCardsProps {
  cards: SummaryCard[]
  title?: string
  className?: string
}

export function SummaryCards({ cards, title, className = '' }: SummaryCardsProps) {
  // Safety check for undefined cards
  if (!cards || !Array.isArray(cards)) {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <div className="text-center py-8 text-gray-500">
          Tidak ada data untuk ditampilkan
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          {title}
        </h3>
      )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`p-2.5 sm:p-3 rounded-lg ${card.color}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  {card.trend && (
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm font-medium ${card.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {card.trend.isPositive ? '+' : ''}{card.trend.value}%
                      </span>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {card.trend.period}
                      </p>
                    </div>
                  )}
                </div>
                
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {card.title}
                </h4>
                
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                  {card.value}
                </p>
                
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  {card.description}
                </p>
                
                {card.actions && card.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {card.actions.map((action, actionIndex) => {
                      const ActionIcon = action.icon
                      
                      return (
                        <Link
                          key={actionIndex}
                          href={action.href}
                          className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {action.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Configuration functions for admin and employee summary cards
export function adminSummaryCards(stats: any) {
  return [
    {
      title: 'Total Karyawan',
      value: stats.totalUsers || 0,
      description: 'Jumlah karyawan terdaftar di sistem',
      icon: Users,
      color: 'bg-blue-500',
      trend: {
        value: 12,
        isPositive: true,
        period: 'bulan ini'
      },
      actions: [
        {
          label: 'Tambah Karyawan',
          href: '/admin/users/create',
          icon: UserPlus
        },
        {
          label: 'Lihat Semua',
          href: '/admin/users',
          icon: Eye
        }
      ]
    },
    {
      title: 'Tugas Aktif',
      value: stats.totalTasks || 0,
      description: 'Tugas yang sedang berlangsung',
      icon: CheckSquare,
      color: 'bg-green-500',
      trend: {
        value: 8,
        isPositive: true,
        period: 'minggu ini'
      },
      actions: [
        {
          label: 'Buat Tugas',
          href: '/admin/tasks/create',
          icon: Plus
        },
        {
          label: 'Lihat Semua',
          href: '/admin/tasks',
          icon: Eye
        }
      ]
    },
    {
      title: 'Kehadiran Hari Ini',
      value: `${stats.todayPresent || 0}/${stats.totalUsers || 0}`,
      description: 'Karyawan yang hadir hari ini',
      icon: Calendar,
      color: 'bg-purple-500',
      trend: {
        value: 95,
        isPositive: true,
        period: 'rata-rata'
      },
      actions: [
        {
          label: 'Lihat Detail',
          href: '/admin/attendance',
          icon: BarChart3
        }
      ]
    }
  ]
}

export function employeeSummaryCards(stats: any) {
  return [
    {
      title: 'Tugas Saya',
      value: stats.totalTasks || 0,
      description: 'Total tugas yang diberikan kepada Anda',
      icon: CheckSquare,
      color: 'bg-blue-500',
      actions: [
        {
          label: 'Lihat Semua',
          href: '/employee/tasks',
          icon: Eye
        }
      ]
    },
    {
      title: 'Kehadiran',
      value: stats.todayPresent ? 'Hadir' : 'Belum Hadir',
      description: 'Status kehadiran hari ini',
      icon: Calendar,
      color: stats.todayPresent ? 'bg-green-500' : 'bg-yellow-500',
      actions: [
        {
          label: 'Check In/Out',
          href: '/employee/attendance',
          icon: Clock
        }
      ]
    },
    {
      title: 'Izin Pending',
      value: stats.pendingLeaveRequests || 0,
      description: 'Permohonan izin yang menunggu validasi',
      icon: Clock,
      color: 'bg-orange-500',
      actions: [
        {
          label: 'Ajukan Izin',
          href: '/employee/leave-requests/create',
          icon: Plus
        },
        {
          label: 'Lihat Status',
          href: '/employee/leave-requests',
          icon: Eye
        }
      ]
    }
  ]
}
