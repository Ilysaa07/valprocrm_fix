"use client"

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  FileText, 
  Bell, 
  User, 
  LogOut,
  Sun,
  Moon,
  MessageCircle,
  Settings,
  Contact,
  FolderKanban,
  Menu,
  X,
  Home
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/employee', icon: LayoutDashboard },
  { name: 'Tasks', href: '/employee/tasks', icon: CheckSquare },
  { name: 'Contacts', href: '/employee/contacts', icon: Contact },
  { name: 'Projects', href: '/employee/projects', icon: FolderKanban },
  { name: 'Attendance', href: '/employee/attendance', icon: Clock },
  { name: 'WFH Log', href: '/employee/wfh', icon: Home },
  { name: 'Documents', href: '/employee/documents', icon: FileText },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Notifications', href: '/employee/notifications', icon: Bell },
  { name: 'Profile', href: '/employee/profile', icon: User },
  { name: 'Settings', href: '/employee/settings', icon: Settings },
]

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Only access localStorage after component mounts
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('sidebar-collapsed')
      if (savedCollapsed) {
        setCollapsed(JSON.parse(savedCollapsed))
      }
      
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
    }
  }, [collapsed, mounted])

  const toggleTheme = () => {
    if (!mounted) return
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const isActive = (href: string) => pathname === href

  // Prevent hydration mismatch during initial load
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 transition-colors duration-200">
        <div className="flex">
          <div className="w-64 bg-white border-r border-gray-200 shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-100 rounded w-16 mt-1"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 ml-64">
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${mounted ? 'bg-gray-50 dark:bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`} suppressHydrationWarning>
      <div className="flex">
        {/* Clean Employee Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
          bg-white border-r border-gray-200
          dark:bg-gray-800 dark:border-gray-700
          transition-all duration-200
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">EMP</span>
                  </div>
                  <div>
                    <h1 className="text-gray-900 dark:text-white font-semibold">ValPro ERP</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Employee</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? (
                  <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
            
            {/* User Profile */}
            <div className="mt-4 flex items-center space-x-3">
              <div className="relative">
                <img
                  src={session?.user?.image || '/default-avatar.svg'}
                  alt="Profile"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-medium text-sm truncate">
                    {session?.user?.name || 'Employee'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Employee</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg
                    ${active 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg
                         bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                         text-gray-700 dark:text-gray-300"
              title={collapsed ? (theme === 'dark' ? 'Light' : 'Dark') : undefined}
            >
              {theme === 'dark' ? (
                <Sun className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
              ) : (
                <Moon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
              )}
              {!collapsed && (
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg
                         bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30
                         text-red-700 dark:text-red-300"
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`
          flex-1 transition-all duration-200
          ${collapsed ? 'ml-16' : 'ml-64'}
          bg-gray-50 dark:bg-gray-900
          min-h-screen
        `}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>
}
