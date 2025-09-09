'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckSquare, Calendar, Sun, Moon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    image?: string
    profilePicture?: string
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
        console.error('Error fetching real-time data:', error)
      }
    }

    // Initial fetch
    fetchRealTimeData()

    // Set up interval for real-time updates
    const interval = setInterval(fetchRealTimeData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-8">
          <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded mb-4"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-300 dark:bg-slate-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-gradient-to-r from-blue-50 via-indigo-50/30 to-cyan-50/20',
      'dark:from-slate-800 dark:via-blue-900/20 dark:to-slate-800',
      'rounded-3xl border border-blue-200/50 dark:border-slate-700/50',
      'p-8 backdrop-blur-sm shadow-xl',
      'relative overflow-hidden',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                {user?.image ? (
                  <img src={user.image} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {getGreeting(currentDate)}, {user?.name || 'User'}! 👋
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Date, Time, and Role Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              {showDateTime && (
                <>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{formatDate(currentDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>{formatTime(currentDate)}</span>
                  </div>
                </>
              )}
              
              {showRole && user?.role && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getRoleText(user.role)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Weather/Time Icon */}
          <div className="mt-6 lg:mt-0 lg:ml-6">
            <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-blue-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="text-center">
                {currentDate.getHours() >= 6 && currentDate.getHours() < 18 ? (
                  <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                ) : (
                  <Moon className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentDate.getHours() >= 6 && currentDate.getHours() < 18 ? 'Siang' : 'Malam'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {showQuickStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-blue-200/50 dark:border-slate-700/50 p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tugas Aktif</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{liveData.activeTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-blue-200/50 dark:border-slate-700/50 p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Notifikasi</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{liveData.notifications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-blue-200/50 dark:border-slate-700/50 p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{liveData.meetings}</p>
                </div>
              </div>
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
