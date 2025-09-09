'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Sidebar from './Sidebar'
import NotificationDropdown from '../NotificationDropdown'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="h-screen min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <Sidebar
        role="ADMIN"
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

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 xl:hidden transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar
          role="ADMIN"
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-card border-b border-border shadow-soft backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
            {/* Left Section */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="xl:hidden p-2 rounded-lg hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <Menu className="h-5 w-5 text-text-secondary" />
              </button>
              
              {/* Page Title */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-text-primary">
                  {title || 'Admin Dashboard'}
                </h1>
                {description && (
                  <p className="text-sm text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationDropdown />
              
              {/* Enhanced User Menu */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-card to-accent/5 rounded-xl px-4 py-2 border border-border shadow-soft hover:shadow-medium transition-all duration-200 group">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-200">
                    {session.user?.name || 'Administrator'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-secondary">
                      Admin
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-text-inverse text-lg font-bold">
                  {session.user?.name?.charAt(0) || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
