'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckSquare, Calendar } from 'lucide-react'

export interface WelcomeConfig {
  title: string
  subtitle: string
  showDateTime: boolean
  showRole: boolean
  showQuickStats: boolean
}

interface WelcomeSectionProps extends WelcomeConfig {
  user?: {
    name?: string
    role?: string
  }
  currentDate?: Date
  className?: string
  realTimeData?: {
    activeTasks: number
    notifications: number
    meetings: number
  }
}

export function WelcomeSection({ 
  title, 
  subtitle, 
  showDateTime = true, 
  showRole = true, 
  showQuickStats = false,
  user,
  currentDate = new Date(),
  className = '',
  realTimeData
}: WelcomeSectionProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGreeting = (date: Date) => {
    const hour = date.getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const getRoleText = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator'
      case 'EMPLOYEE':
        return 'Karyawan'
      case 'CLIENT':
        return 'Klien'
      default:
        return 'User'
    }
  }

  const [mounted, setMounted] = useState(false)
  const [liveData, setLiveData] = useState({
    activeTasks: 0,
    notifications: 0,
    meetings: 0
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Fetch real-time data
    const fetchRealTimeData = async () => {
      try {
        const response = await fetch('/api/dashboard/real-time-stats')
        if (response.ok) {
          const data = await response.json()
          setLiveData({
            activeTasks: data.activeTasks || 0,
            notifications: data.notifications || 0,
            meetings: data.meetings || 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch real-time data:', error)
      }
    }

    fetchRealTimeData()
    
    // Update every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000)
    
    return () => clearInterval(interval)
  }, [mounted])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="w-1 h-12 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white">
                {getGreeting(currentDate)}, {user?.name || 'User'}!
              </h1>
              {showRole && user?.role && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {getRoleText(user.role)}
                </p>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="mt-4 space-y-2">
            <p className="text-gray-700 dark:text-gray-200 text-lg font-medium">
              {title}
            </p>
            
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 text-base">
                {subtitle}
              </p>
            )}
            
            {showDateTime && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">{formatDate(currentDate)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm">{formatTime(currentDate)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
          
        {/* Quick stats */}
        {showQuickStats && (
          <div className="flex lg:flex-col items-center lg:items-end gap-4">
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {realTimeData?.activeTasks ?? liveData.activeTasks}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tugas Aktif</p>
            </div>
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end gap-2 mb-1">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {realTimeData?.notifications ?? liveData.notifications}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Notifikasi</p>
            </div>
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {realTimeData?.meetings ?? liveData.meetings}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Meeting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Configuration functions for admin and employee welcome sections
export function adminWelcomeConfig(user?: { name?: string; role?: string }, currentDate?: Date) {
  return {
    title: 'Selamat Datang di Dashboard Admin',
    subtitle: 'Kelola sistem perusahaan, monitor kinerja karyawan, dan buat keputusan yang tepat',
    showDateTime: true,
    showRole: true,
    showQuickStats: true
  }
}

export function employeeWelcomeConfig(user?: { name?: string; role?: string }, currentDate?: Date) {
  return {
    title: 'Selamat Datang di Dashboard Karyawan',
    subtitle: 'Kelola tugas Anda, catat kehadiran, dan ajukan permohonan dengan mudah',
    showDateTime: true,
    showRole: true,
    showQuickStats: false
  }
}
