'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Users, Clock, CheckSquare, CheckCircle, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface StatConfig {
  title: string
  value: number | string
  description: string
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  link?: string
}

interface StatCardProps extends StatConfig {}

export function StatCard({ title, value, description, icon: Icon, color, trend, link }: StatCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cardContent = (
    <Card 
      className={`group relative overflow-hidden bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-300/50 dark:hover:border-primary-600/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-secondary-50/20 dark:from-primary-900/10 dark:via-transparent dark:to-secondary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardBody className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`relative p-3 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1">{title}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-secondary-600 dark:group-hover:from-primary-400 dark:group-hover:to-secondary-400 transition-all duration-300">{value}</p>
              {trend && (
                <div className="flex items-center mt-2">
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-secondary-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${trend.isPositive ? 'text-secondary-600 dark:text-secondary-400' : 'text-danger-600 dark:text-danger-400'}`}>
                    {trend.value}% {trend.period}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Hover indicator */}
          <div className={`w-2 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full transition-all duration-300 ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}></div>
        </div>
        
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-300">{description}</p>
        )}
      </CardBody>
    </Card>
  )

  if (link) {
    return (
      <a href={link} className="block">
        {cardContent}
      </a>
    )
  }

  return cardContent
}

// Configuration functions for admin and employee stats
export function adminStatConfigs(stats: any) {
  return {
    totalUsers: {
      title: 'Total Karyawan',
      value: stats.totalUsers || 0,
      description: 'Jumlah karyawan terdaftar',
      icon: Users,
      color: 'bg-gradient-to-br from-primary-500 to-primary-600',
      link: '/admin/users'
    },
    pendingUsers: {
      title: 'Menunggu Validasi',
      value: stats.pendingUsers || 0,
      description: 'Karyawan yang belum divalidasi',
      icon: Clock,
      color: 'bg-gradient-to-br from-accent-500 to-accent-600',
      link: '/admin/users?status=pending'
    },
    totalTasks: {
      title: 'Total Tugas',
      value: stats.totalTasks || 0,
      description: 'Jumlah tugas yang ada',
      icon: CheckSquare,
      color: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
      link: '/admin/tasks'
    },
    completedTasks: {
      title: 'Tugas Selesai',
      value: stats.completedTasks || 0,
      description: 'Tugas yang telah diselesaikan',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-info-500 to-info-600',
      link: '/admin/tasks?status=completed'
    }
  }
}

export function employeeStatConfigs(stats: any) {
  return {
    totalTasks: {
      title: 'Total Tugas',
      value: stats.totalTasks || 0,
      description: 'Tugas yang diberikan kepada Anda',
      icon: CheckSquare,
      color: 'bg-gradient-to-br from-primary-500 to-primary-600',
      link: '/employee/tasks'
    },
    completedTasks: {
      title: 'Tugas Selesai',
      value: stats.completedTasks || 0,
      description: 'Tugas yang telah Anda selesaikan',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
      link: '/employee/tasks?status=completed'
    },
    pendingTasks: {
      title: 'Tugas Pending',
      value: stats.pendingTasks || 0,
      description: 'Tugas yang sedang dalam proses',
      icon: Clock,
      color: 'bg-gradient-to-br from-accent-500 to-accent-600',
      link: '/employee/tasks?status=pending'
    },
    unreadNotifications: {
      title: 'Notifikasi',
      value: stats.unreadNotifications || 0,
      description: 'Notifikasi yang belum dibaca',
      icon: Bell,
      color: 'bg-gradient-to-br from-info-500 to-info-600',
      link: '/employee/notifications'
    }
  }
}
