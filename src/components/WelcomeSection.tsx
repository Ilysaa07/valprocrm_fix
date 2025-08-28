'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { User, Calendar, Clock } from 'lucide-react'

interface WelcomeSectionProps {
  userName: string
  userRole: string
  title?: string
  subtitle?: string
  showDateTime?: boolean
  showUserInfo?: boolean
  className?: string
}

export function WelcomeSection({ 
  userName, 
  userRole, 
  title,
  subtitle,
  showDateTime = true,
  showUserInfo = true,
  className = '' 
}: WelcomeSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const getRoleLabel = () => {
    const roleLabels = {
      ADMIN: 'Administrator',
      EMPLOYEE: 'Karyawan',
      MANAGER: 'Manager'
    }
    return roleLabels[userRole as keyof typeof roleLabels] || userRole
  }

  const formatDateTime = () => {
    const now = new Date()
    return now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 ${className}`}>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {title || `${getGreeting()}, ${userName}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {subtitle || `Selamat datang di dashboard ${getRoleLabel()}. Pantau aktivitas dan kelola tugas Anda.`}
            </p>
            
            {showDateTime && (
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDateTime()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatTime()}</span>
                </div>
              </div>
            )}
          </div>
          
          {showUserInfo && (
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel()}</p>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

// Predefined welcome configurations
export const adminWelcomeConfig = (userName: string) => ({
  title: `Selamat Datang, ${userName}`,
  subtitle: 'Pantau ringkasan sistem dan akses fitur utama untuk mengelola perusahaan.',
  showDateTime: true,
  showUserInfo: true
})

export const employeeWelcomeConfig = (userName: string) => ({
  title: `Selamat Datang, ${userName}`,
  subtitle: 'Ini adalah dashboard karyawan untuk mengelola tugas dan aktivitas Anda.',
  showDateTime: true,
  showUserInfo: true
})
