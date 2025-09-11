"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Sidebar from './Sidebar'
import NotificationDropdown from '../NotificationDropdown'
import { cn } from '@/lib/utils'

interface EmployeeLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function EmployeeLayout({ children, title, description }: EmployeeLayoutProps) {
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
        setMobileSidebarOpen(false) // Close mobile sidebar on resize
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileSidebarOpen])

  // Debug mobile sidebar state
  useEffect(() => {
    console.log('Employee Mobile sidebar state:', mobileSidebarOpen)
  }, [mobileSidebarOpen])

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
      <div className="hidden xl:block">
        <Sidebar
          role="EMPLOYEE"
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          toggleTheme={toggleTheme}
          unreadNotifications={3}
          unreadMessages={2}
          pendingTasks={5}
          pendingApprovals={1}
          isMobile={false}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => {
            console.log('Employee Overlay clicked, closing sidebar')
            setMobileSidebarOpen(false)
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed left-0 top-0 z-50 xl:hidden w-80 h-screen transition-transform duration-300 ease-in-out ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          role="EMPLOYEE"
          collapsed={false}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          toggleTheme={toggleTheme}
          unreadNotifications={3}
          unreadMessages={2}
          pendingTasks={5}
          pendingApprovals={1}
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
                onClick={() => {
                  console.log('Employee Hamburger clicked, current state:', mobileSidebarOpen)
                  setMobileSidebarOpen(!mobileSidebarOpen)
                }}
                className="xl:hidden p-2 rounded-lg hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-card border border-border shadow-sm flex items-center justify-center"
                aria-label="Open sidebar menu"
                title="Open sidebar menu"
              >
                <Menu className="h-5 w-5 text-text-secondary" />
              </button>
              
              {/* Page Title */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-text-primary">
                  {title || 'Employee Dashboard'}
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
                    {session.user?.name || 'Employee'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-secondary">
                      Employee
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-text-inverse text-sm font-semibold overflow-hidden">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Employee'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    session.user?.name?.charAt(0) || 'E'
                  )}
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

