'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Sidebar from './Sidebar'
import NotificationDropdown from '../NotificationDropdown'

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true)
        setMobileSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
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

  const defaultTitle = role === 'ADMIN' ? 'Admin Dashboard' : 'Employee Dashboard'
  const userName = session.user?.name || (role === 'ADMIN' ? 'Administrator' : 'Employee')
  const userInitial = session.user?.name?.charAt(0) || (role === 'ADMIN' ? 'A' : 'E')

  return (
    <div className="h-screen min-h-screen bg-bg flex">
      <div className="hidden xl:block">
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
      </div>

      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={`fixed left-0 top-0 z-50 xl:hidden w-80 h-screen transition-transform duration-300 ease-in-out ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          role={role}
          collapsed={false}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          toggleTheme={toggleTheme}
          unreadNotifications={role === 'ADMIN' ? 5 : 3}
          unreadMessages={role === 'ADMIN' ? 3 : 2}
          pendingTasks={role === 'ADMIN' ? 8 : 5}
          pendingApprovals={role === 'ADMIN' ? 2 : 1}
          isMobile={true}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-card border-b border-border shadow-soft backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="xl:hidden p-2 rounded-lg hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-card border border-border shadow-sm flex items-center justify-center"
                aria-label="Open sidebar menu"
                title="Open sidebar menu"
              >
                <Menu className="h-5 w-5 text-text-secondary" />
              </button>

              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-text-primary">
                  {title || defaultTitle}
                </h1>
                {description && (
                  <p className="text-sm text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationDropdown />

              <div className="flex items-center space-x-3 bg-gradient-to-r from-card to-accent/5 rounded-xl px-4 py-2 border border-border shadow-soft hover:shadow-medium transition-all duration-200 group">
                <div className="hidden sm:block text-right">
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
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


