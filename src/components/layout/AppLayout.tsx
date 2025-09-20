'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import Sidebar from './Sidebar'
import MobileTabBar from './MobileTabBar'
import NotificationDropdown from '../NotificationDropdown'
import SkipLink from '../ui/SkipLink'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  role: 'ADMIN' | 'EMPLOYEE'
}

export default function AppLayout({ children, title, description, role }: AppLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1200
      setIsMobile(mobile)
      
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle escape key for any future mobile interactions
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    handleResize()
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
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

  const defaultTitle = role === 'ADMIN' ? 'Admin Dashboard' : 'Employee Dashboard'
  const userName = session.user?.name || (role === 'ADMIN' ? 'Administrator' : 'Employee')
  const userInitial = session.user?.name?.charAt(0) || (role === 'ADMIN' ? 'A' : 'E')

  return (
    <div className="layout-container">
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#navigation">
        Skip to navigation
      </SkipLink>


      {/* Navigation Landmark */}
      <nav id="navigation" aria-label="Main navigation">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar
            role={role}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            theme={theme}
            toggleTheme={toggleTheme}
            unreadNotifications={role === 'ADMIN' ? 5 : 3}
            unreadMessages={role === 'ADMIN' ? 3 : 2}
            pendingTasks={role === 'ADMIN' ? 8 : 5}
            pendingApprovals={role === 'ADMIN' ? 2 : 1}
            isMobile={false}
          />
        )}

        {/* Mobile Tab Bar */}
        {isMobile && (
          <MobileTabBar
            role={role}
            unreadNotifications={role === 'ADMIN' ? 5 : 3}
            unreadMessages={role === 'ADMIN' ? 3 : 2}
            pendingTasks={role === 'ADMIN' ? 8 : 5}
            pendingApprovals={role === 'ADMIN' ? 2 : 1}
          />
        )}
      </nav>

      {/* Main Content Area */}
      <main id="main-content" className="layout-main" role="main" aria-label="Main content">
        {/* Header */}
        <header className="dashboard-header" role="banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Page Title */}
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-text-primary truncate">
                  {title || defaultTitle}
                </h1>
                {description && (
                  <p className="text-sm text-text-secondary truncate">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 sm:gap-4" role="toolbar" aria-label="Header actions">
              <NotificationDropdown />

              {/* User Profile */}
              <div 
                className="flex items-center gap-3 bg-gradient-to-r from-card to-accent/5 rounded-xl px-3 sm:px-4 py-2 border border-border shadow-soft hover:shadow-medium transition-all duration-200 group"
                role="button"
                tabIndex={0}
                aria-label={`User profile: ${userName}, ${role === 'ADMIN' ? 'Administrator' : 'Employee'}`}
              >
                <div className="hidden sm:block text-right min-w-0">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-200">
                    {userName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-secondary">
                      {role === 'ADMIN' ? 'Admin' : 'Employee'}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-text-inverse text-sm font-semibold overflow-hidden">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={`${userName} profile picture`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{userInitial}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content" role="region" aria-label="Page content">
          <div className="max-w-7xl mx-auto space-y-6 content-wrapper">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}


