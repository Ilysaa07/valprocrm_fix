'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/components/layout/ThemeProvider'
import Sidebar from '@/components/layout/Sidebar'
import SkipLink from '@/components/ui/SkipLink'
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  User, 
  BarChart3, 
  Users, 
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DemoPage() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'EMPLOYEE'>('ADMIN')

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1200
      setIsMobile(mobile)
      
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile && mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => { 
      document.body.style.overflow = 'unset' 
    }
  }, [isMobile, mobileSidebarOpen])

  const stats = [
    {
      title: 'Total Pengguna',
      value: '2,847',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Pendapatan Bulan Ini',
      value: 'Rp 45.2M',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: DollarSign
    },
    {
      title: 'Tugas Aktif',
      value: '156',
      change: '-3%',
      changeType: 'negative' as const,
      icon: Activity
    },
    {
      title: 'Tingkat Kehadiran',
      value: '94.5%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ]

  const recentActivities = [
    { id: 1, user: 'John Doe', action: 'menyelesaikan tugas', target: 'Laporan Keuangan Q3', time: '2 menit lalu' },
    { id: 2, user: 'Jane Smith', action: 'menambahkan', target: 'Klien baru: PT ABC', time: '15 menit lalu' },
    { id: 3, user: 'Mike Johnson', action: 'mengupdate', target: 'Status proyek Website', time: '1 jam lalu' },
    { id: 4, user: 'Sarah Wilson', action: 'mengirim', target: 'Invoice #INV-2024-001', time: '2 jam lalu' }
  ]

  return (
    <div className="layout-container">
      {/* Skip Links */}
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#navigation">
        Skip to navigation
      </SkipLink>

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div 
          className={cn(
            "mobile-sidebar-overlay",
            mobileSidebarOpen && "show"
          )}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation */}
      <nav id="navigation" aria-label="Main navigation">
        {!isMobile && (
          <Sidebar
            role={currentRole}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            theme={theme}
            toggleTheme={toggleTheme}
            unreadNotifications={5}
            unreadMessages={3}
            pendingTasks={8}
            pendingApprovals={2}
            isMobile={false}
          />
        )}

        {isMobile && (
          <Sidebar
            role={currentRole}
            collapsed={false}
            setCollapsed={setSidebarCollapsed}
            theme={theme}
            toggleTheme={toggleTheme}
            unreadNotifications={5}
            unreadMessages={3}
            pendingTasks={8}
            pendingApprovals={2}
            isMobile={true}
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}
      </nav>

      {/* Main Content */}
      <main id="main-content" className="layout-main" role="main">
        {/* Header */}
        <header className="dashboard-header" role="banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {isMobile && (
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="p-2.5 rounded-lg hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-card border border-border shadow-sm"
                  aria-label={mobileSidebarOpen ? "Close sidebar menu" : "Open sidebar menu"}
                  aria-expanded={mobileSidebarOpen}
                  aria-controls="navigation"
                >
                  {mobileSidebarOpen ? (
                    <X className="h-5 w-5 text-text-secondary" />
                  ) : (
                    <Menu className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
              )}

              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-text-primary">
                  Demo Dashboard - {currentRole === 'ADMIN' ? 'Admin' : 'Employee'}
                </h1>
                <p className="text-sm text-text-secondary">
                  Testing responsivitas dan dark mode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Role Toggle */}
              <button
                onClick={() => setCurrentRole(currentRole === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                Switch to {currentRole === 'ADMIN' ? 'Employee' : 'Admin'}
              </button>

              {/* Search */}
              {!isMobile && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Cari..."
                    className="pl-10 pr-4 py-2 w-48 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                </div>
              )}

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-card-hover transition-colors relative">
                <Bell className="h-5 w-5 text-text-secondary" />
                <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  3
                </span>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-card to-accent/5 rounded-xl px-3 py-2 border border-border">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-text-primary">Demo User</p>
                  <p className="text-xs text-text-secondary">{currentRole}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-text-inverse text-sm font-semibold">
                  <User className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Grid */}
            <div className="dashboard-grid dashboard-grid-4">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <stat.icon className="h-5 w-5 text-accent" />
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      stat.changeType === 'positive' ? 'text-success' : 'text-error'
                    )}>
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-1">
                      {stat.title}
                    </h3>
                    <p className="text-2xl font-bold text-text-primary">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Grid */}
            <div className="dashboard-grid dashboard-grid-2">
              {/* Chart Card */}
              <div className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Analitik Performa
                  </h3>
                  <BarChart3 className="h-5 w-5 text-text-muted" />
                </div>
                <div className="h-64 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-accent mx-auto mb-2" />
                    <p className="text-text-secondary">Chart Placeholder</p>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Aktivitas Terbaru
                  </h3>
                  <Activity className="h-5 w-5 text-text-muted" />
                </div>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-card-hover transition-colors">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary">
                          <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <p className="text-xs text-text-muted">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Aksi Cepat
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: FileText, label: 'Buat Laporan', color: 'bg-blue-500' },
                  { icon: Users, label: 'Tambah Pengguna', color: 'bg-green-500' },
                  { icon: Calendar, label: 'Jadwal Meeting', color: 'bg-purple-500' },
                  { icon: MessageSquare, label: 'Kirim Pesan', color: 'bg-orange-500' }
                ].map((action, index) => (
                  <button
                    key={index}
                    className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-card-hover transition-colors group"
                  >
                    <div className={cn('p-3 rounded-lg text-white mb-2', action.color)}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

