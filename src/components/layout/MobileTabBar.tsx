'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'
import { 
  Home, 
  Users, 
  Settings, 
  CheckSquare, 
  MessageCircle, 
  Bell, 
  FileText,
  UserCheck,
  BarChart3,
  DollarSign,
  Clock,
  MapPin,
  Receipt,
  MoreHorizontal,
  LogOut,
  Sun,
  Moon
} from 'lucide-react'

interface TabItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  isNew?: boolean
}

interface MobileTabBarProps {
  role: 'ADMIN' | 'EMPLOYEE'
  unreadNotifications?: number
  unreadMessages?: number
  pendingTasks?: number
  pendingApprovals?: number
}

export default function MobileTabBar({ 
  role, 
  unreadNotifications = 0,
  unreadMessages = 0,
  pendingTasks = 0,
  pendingApprovals = 0
}: MobileTabBarProps) {
  const [mounted, setMounted] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeTab, setActiveTab] = useState('')
  const [rippleEffect, setRippleEffect] = useState<{ x: number; y: number } | null>(null)
  const pathname = usePathname()
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Define primary tabs (always visible)
  const getPrimaryTabs = (): TabItem[] => {
    if (role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Pengguna', href: '/admin/users', icon: Users, badge: pendingApprovals },
        { name: 'Tugas', href: '/admin/tasks', icon: CheckSquare, badge: pendingTasks },
        { name: 'Chat', href: '/admin/chat', icon: MessageCircle, badge: unreadMessages },
        { name: 'Lainnya', href: '#', icon: MoreHorizontal }
      ]
    } else {
      return [
        { name: 'Dashboard', href: '/employee', icon: Home },
        { name: 'Tugas', href: '/employee/tasks', icon: CheckSquare, badge: pendingTasks },
        { name: 'Absensi', href: '/employee/attendance', icon: UserCheck },
        { name: 'Chat', href: '/employee/chat', icon: MessageCircle, badge: unreadMessages },
        { name: 'Lainnya', href: '#', icon: MoreHorizontal }
      ]
    }
  }

  // Define secondary tabs (in more menu)
  const getSecondaryTabs = (): TabItem[] => {
    if (role === 'ADMIN') {
      return [
        { name: 'Analitik', href: '/admin/analytics', icon: BarChart3, isNew: true },
        { name: 'Kehadiran', href: '/admin/attendance', icon: UserCheck },
        { name: 'Keuangan', href: '/admin/finance', icon: DollarSign },
        { name: 'Invoice', href: '/admin/invoices', icon: Receipt, isNew: true },
        { name: 'Slip Gaji', href: '/admin/payroll', icon: FileText, isNew: true },
        { name: 'Dokumen', href: '/admin/documents', icon: FileText },
        { name: 'Notifikasi', href: '/admin/notifications', icon: Bell, badge: unreadNotifications },
        { name: 'Pengaturan', href: '/admin/settings', icon: Settings }
      ]
    } else {
      return [
        { name: 'Dokumen', href: '/employee/documents', icon: FileText },
        { name: 'Cuti', href: '/employee/leave-requests', icon: Clock },
        { name: 'WFH', href: '/employee/wfh', icon: MapPin },
        { name: 'Invoice', href: '/employee/invoices', icon: Receipt, isNew: true },
        { name: 'Slip Gaji', href: '/employee/payroll', icon: FileText, isNew: true },
        { name: 'Notifikasi', href: '/employee/notifications', icon: Bell, badge: unreadNotifications },
        { name: 'Pengaturan', href: '/employee/settings', icon: Settings }
      ]
    }
  }

  // Handle logout
  const handleLogout = () => {
    setIsAnimating(true)
    setTimeout(() => {
      signOut({ 
        callbackUrl: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/login`
          : 'https://crm.valprointertech.com/auth/login'
      })
    }, 300)
  }

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsAnimating(true)
    setTimeout(() => {
      toggleTheme()
      setIsAnimating(false)
    }, 200)
  }

  // Handle ripple effect
  const createRippleEffect = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setRippleEffect({ x, y })
    
    setTimeout(() => {
      setRippleEffect(null)
    }, 600)
  }

  // Handle tab click with animation
  const handleTabClick = (tabName: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tabName)
    if (event) {
      createRippleEffect(event)
    }
    
    setTimeout(() => {
      setActiveTab('')
    }, 300)
  }

  const primaryTabs = getPrimaryTabs()
  const secondaryTabs = getSecondaryTabs()
  const isActive = (href: string) => pathname === href

  if (!mounted) return null

  return (
    <>
      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-in-from-bottom" role="navigation" aria-label="Menu bawah">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 shadow-lg relative overflow-visible">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 animate-float-up"></div>
          <div className="flex items-center justify-around px-2 py-2">
            {primaryTabs.map((tab, index) => {
              const active = isActive(tab.href)
              
              if (tab.name === 'Lainnya') {
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleTabClick('Lainnya', e)
                        setShowMoreMenu(!showMoreMenu)
                      }}
                      className={cn(
                        'relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300',
                        'hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-105',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                        'active:scale-95 active:animate-tab-shake',
                        showMoreMenu && 'bg-blue-50 dark:bg-blue-900/20 animate-glow-effect',
                        activeTab === 'Lainnya' && 'animate-tab-pulse'
                      )}
                      aria-label="Lainnya options"
                      aria-haspopup="true"
                      aria-expanded={showMoreMenu}
                      aria-label="Buka menu lainnya"
                    >
                      {/* Ripple Effect */}
                      {rippleEffect && activeTab === 'Lainnya' && (
                        <div
                          className="absolute animate-ripple-effect bg-blue-400/30 rounded-full pointer-events-none"
                          style={{
                            left: rippleEffect.x - 10,
                            top: rippleEffect.y - 10,
                            width: 20,
                            height: 20,
                          }}
                        />
                      )}
                      <div className="relative">
                        <tab.icon className={cn(
                          'h-5 w-5 transition-colors duration-200',
                          showMoreMenu ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                        )} />
                        {secondaryTabs.some(t => t.badge && t.badge > 0) && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                            {secondaryTabs.reduce((sum, t) => sum + (t.badge || 0), 0)}
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs mt-1 font-medium transition-colors duration-200',
                        showMoreMenu ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      )}>
                        Lainnya
                      </span>
                    </button>

                    {/* Lainnya Menu Dropdown */}
                    {showMoreMenu && (
                      <div 
                        className="fixed bottom-20 right-4 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-bounce-in z-[9999]"
                        style={{ zIndex: 9999 }}
                      >
                        <div className="p-2">
                          {secondaryTabs.map((tab, tabIndex) => (
                            <Link
                              key={tabIndex}
                              href={tab.href}
                              onClick={() => setShowMoreMenu(false)}
                              className={cn(
                                'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 animate-fade-in-up',
                                'hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-105',
                                'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                                'active:scale-95',
                                isActive(tab.href) && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 animate-glow-effect'
                              )}
                              style={{ animationDelay: `${tabIndex * 50}ms` }}
                            >
                              <div className="relative mr-3">
                                <tab.icon className={cn(
                                  'h-4 w-4 transition-colors duration-200',
                                  isActive(tab.href) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                                )} />
                                {tab.badge && tab.badge > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                    {tab.badge > 99 ? '99+' : tab.badge}
                                  </span>
                                )}
                              </div>
                              <span className={cn(
                                'flex-1 text-sm font-medium transition-colors duration-200',
                                isActive(tab.href) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                              )}>
                                {tab.name}
                              </span>
                              {tab.isNew && (
                                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                  Baru
                                </span>
                              )}
                            </Link>
                          ))}
                          
                          {/* Divider */}
                          <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
                          
                          {/* Theme Toggle */}
                          <button
                            onClick={handleThemeToggle}
                            className={cn(
                              'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 w-full animate-fade-in-up',
                              'hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-105',
                              'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                              'active:scale-95',
                              isAnimating && 'animate-tab-pulse'
                            )}
                            style={{ animationDelay: `${secondaryTabs.length * 50}ms` }}
                          >
                            <div className="relative mr-3">
                              {theme === 'light' ? (
                                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
                              ) : (
                                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
                              )}
                            </div>
                            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                              {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
                            </span>
                          </button>
                          
                          {/* Logout Button */}
                          <button
                            onClick={handleLogout}
                            className={cn(
                              'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 w-full animate-fade-in-up',
                              'hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105',
                              'focus:outline-none focus:ring-2 focus:ring-red-500/40',
                              'active:scale-95',
                              'text-red-600 dark:text-red-400',
                              isAnimating && 'animate-tab-pulse'
                            )}
                            style={{ animationDelay: `${(secondaryTabs.length + 1) * 50}ms` }}
                          >
                            <div className="relative mr-3">
                              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400 transition-colors duration-200" />
                            </div>
                            <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400 transition-colors duration-200">
                              Keluar
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={index}
                  href={tab.href}
                  onClick={(e) => handleTabClick(tab.name, e as unknown as React.MouseEvent<HTMLButtonElement>)}
                  className={cn(
                    'relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300',
                    'hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-105',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                    'active:scale-95 active:animate-tab-shake',
                    active && 'bg-blue-50 dark:bg-blue-900/20 animate-glow-effect',
                    activeTab === tab.name && 'animate-tab-pulse'
                  )}
                  aria-current={active ? 'page' : undefined}
                  aria-label={`Buka ${tab.name}`}
                >
                  {/* Ripple Effect */}
                  {rippleEffect && activeTab === tab.name && (
                    <div
                      className="absolute animate-ripple-effect bg-blue-400/30 rounded-full pointer-events-none"
                      style={{
                        left: rippleEffect.x - 10,
                        top: rippleEffect.y - 10,
                        width: 20,
                        height: 20,
                      }}
                    />
                  )}
                  <div className="relative">
                    <tab.icon className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    )} />
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs mt-1 font-medium transition-colors duration-200',
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {tab.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Backdrop for Lainnya menu */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden animate-fade-in-up"
          onClick={() => {
            setShowMoreMenu(false)
          }}
          aria-hidden="true"
        />
      )}

      {/* Bottom padding for mobile content */}
      <div className="h-20 md:hidden" />
    </>
  )
}
