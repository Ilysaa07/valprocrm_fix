'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'
import { 
  Home, 
  Users, 
  Settings, 
  Contact, 
  CheckSquare, 
  MessageCircle, 
  Bell, 
  Menu, 
  X, 
  Calendar,
  FileText,
  UserCheck,
  ChevronRight,
  Search,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  BarChart3,
  UserCircle,
  Receipt,
  Grid3X3,
  Building2,
  Cog,
  DollarSign,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  description?: string
  isNew?: boolean
}

interface NavigationSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  role?: string
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  unreadNotifications?: number
  unreadMessages?: number
  pendingTasks?: number
  pendingApprovals?: number
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ 
  role = 'ADMIN', 
  collapsed, 
  setCollapsed, 
  theme: _propTheme, 
  toggleTheme: _propToggleTheme,
  unreadNotifications = 0,
  unreadMessages = 0,
  pendingTasks = 0,
  pendingApprovals = 0,
  isMobile = false,
  isOpen = false,
  onClose
}: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { theme, toggle: toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'Manajemen': true,
    'Komunikasi': true,
    'Sistem': true,
    'Kerja': true,
    'Profil': true
  })
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && !collapsed && !isMobile) {
        setCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed, setCollapsed, isMobile])

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => pathname === href

  // Define navigation sections based on role
  const adminNavigationSections: NavigationSection[] = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Ringkasan', href: '/admin', icon: Home, description: 'Ringkasan sistem', isNew: false },
        { name: 'Kalender', href: '/admin/calendar', icon: Calendar, description: 'Jadwal & acara', isNew: false },
        { name: 'Analitik', href: '/admin/analytics', icon: BarChart3, description: 'Laporan & statistik', isNew: true }
      ]
    },
    {
      title: 'Manajemen',
      items: [
        { name: 'Pengguna', href: '/admin/users', icon: Users, description: 'Manajemen pengguna', badge: pendingApprovals, isNew: false },
        { name: 'Kontak', href: '/admin/contacts', icon: Contact, description: 'Database kontak', isNew: false },
        { name: 'Kehadiran', href: '/admin/attendance', icon: UserCheck, description: 'Manajemen kehadiran', isNew: false }
      ]
    },
    {
      title: 'Keuangan',
      items: [
        { name: 'Keuangan', href: '/admin/finance', icon: DollarSign, description: 'Manajemen keuangan', isNew: false },
        { name: 'Invoice', href: '/admin/invoices', icon: Receipt, description: 'Manajemen invoice', isNew: false }
      ]
    },
    {
      title: 'Komunikasi',
      items: [
        { name: 'Chat', href: '/admin/chat', icon: MessageCircle, description: 'Chat tim', badge: unreadMessages, isNew: false },
        { name: 'Notifikasi', href: '/admin/notifications', icon: Bell, description: 'Peringatan sistem', badge: unreadNotifications, isNew: false }
      ]
    },
    {
      title: 'Kerja',
      items: [
        { name: 'Tugas', href: '/admin/tasks', icon: CheckSquare, description: 'Manajemen tugas', badge: pendingTasks, isNew: false },
        { name: 'Dokumen', href: '/admin/documents', icon: FileText, description: 'Manajemen file', isNew: false },
        { name: 'WFH Validasi', href: '/admin/wfh/validation', icon: MapPin, description: 'Validasi work from home', isNew: false }
      ]
    },
    {
      title: 'Sistem',
      items: [
        { name: 'Pengaturan', href: '/admin/settings', icon: Settings, description: 'Konfigurasi sistem', isNew: false }
      ]
    }
  ]

  const employeeNavigationSections: NavigationSection[] = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Ringkasan', href: '/employee', icon: Home, description: 'Ringkasan kerja', isNew: false },
        { name: 'Kalender', href: '/employee/calendar', icon: Calendar, description: 'Jadwal saya', isNew: false }
      ]
    },
    {
      title: 'Kerja',
      items: [
        { name: 'Tugas', href: '/employee/tasks', icon: CheckSquare, description: 'Tugas saya', badge: pendingTasks, isNew: false },
        { name: 'Dokumen', href: '/employee/documents', icon: FileText, description: 'File saya', isNew: false }
      ]
    },
    {
      title: 'Kehadiran',
      items: [
        { name: 'Absensi', href: '/employee/attendance', icon: UserCheck, description: 'Kehadiran saya', isNew: false },
        { name: 'Cuti', href: '/employee/leave-requests', icon: Clock, description: 'Pengajuan cuti', isNew: false },
        { name: 'Work From Home', href: '/employee/wfh', icon: MapPin, description: 'WFH saya', isNew: false }
      ]
    },
    {
      title: 'Komunikasi',
      items: [
        { name: 'Chat', href: '/employee/chat', icon: MessageCircle, description: 'Chat tim', badge: unreadMessages, isNew: false },
        { name: 'Notifikasi', href: '/employee/notifications', icon: Bell, description: 'Peringatan saya', badge: unreadNotifications, isNew: false },
        { name: 'Kontak', href: '/employee/contacts', icon: Contact, description: 'Kontak tim', isNew: false }
      ]
    },
    {
      title: 'Profil',
      items: [
        { name: 'Pengaturan', href: '/employee/settings', icon: Settings, description: 'Pengaturan pribadi', isNew: false }
      ]
    }
  ]

  const navigationSections = role === 'ADMIN' ? adminNavigationSections : employeeNavigationSections

  const filteredSections = searchQuery
    ? navigationSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : navigationSections

  if (!mounted) return null

  // Enhanced responsive width calculation
  const getSidebarWidth = () => {
    if (isMobile) return 'w-80' // Mobile: fixed width (320px)
    if (collapsed) return 'w-16' // Collapsed: minimal width (64px)
    return 'w-64' // Expanded: standard width (256px)
  }

  // Enhanced responsive behavior with proper background
  const getSidebarClasses = () => {
    const baseClasses = [
      'flex flex-col h-screen transition-all duration-300 ease-out',
      'bg-surface',
      'border-r border-border',
      'shadow-lg'
    ]

    // Width classes
    baseClasses.push(getSidebarWidth())

    // Mobile-specific classes
    if (isMobile) {
      baseClasses.push(
        'fixed left-0 top-0 z-50',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )
    } else {
      baseClasses.push('relative')
    }

    // Responsive visibility - Use proper breakpoints
    if (!isMobile) {
      baseClasses.push('hidden xl:block') // Show on xl screens and up (1280px+)
    }

    return baseClasses.join(' ')
  }

  return (
    <div className={`${getSidebarClasses()} layout-sidebar min-h-0`}>
      {/* Header */}
      <div className="px-4 py-6 border-b border-border bg-gradient-to-r from-bg-secondary to-surface">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <img 
                  src="/logometa.png" 
                  alt="Valpro Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">ValproCRM</h1>
                <p className="text-xs text-text-secondary font-medium">
                  {role === 'ADMIN' ? 'Portal Admin' : 'Portal Karyawan'}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <img 
                src="/logometa.png" 
                alt="Valpro Logo" 
                className="w-5 h-5 object-contain"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40"
            title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            aria-label={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {collapsed ? (
              <Menu className="h-4 w-4 text-text-secondary" />
            ) : (
              <X className="h-4 w-4 text-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* User Profile Section - REMOVED (moved to navbar) */}
      {/* Removed user profile section as requested - moved to navbar */}

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-card-hover transition-colors duration-200"
              title="Hapus pencarian"
            >
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation - viewport-bound scroll with fixed max height */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent" style={{ maxHeight: 'calc(100vh - 225px)' }}>
        {filteredSections.map((section, sectionIndex) => {
          const toggleSection = () => {
            setExpandedSections(prev => ({
              ...prev,
              [section.title]: !(prev[section.title])
            }));
          };
          
          const isSectionExpanded = expandedSections[section.title] !== false;
          
          return (
            <div key={sectionIndex} className="mb-6 px-4">
              {!collapsed ? (
                <div 
                  className="flex items-center justify-between mb-3 cursor-pointer group"
                  onClick={toggleSection}
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors duration-200">
                    {section.title}
                  </h3>
                  <ChevronDown className={cn(
                    "h-3 w-3 text-text-muted transition-transform duration-200",
                    isSectionExpanded ? "transform rotate-180" : ""
                  )} />
                </div>
              ) : (
                <div className="h-px my-4 bg-border"></div>
              )}
              
              {(isSectionExpanded || collapsed) && (
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const active = isActive(item.href)
                    const hasBadge = item.badge && item.badge > 0
                    
                    return (
                      <li key={itemIndex}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (isMobile && onClose) {
                              onClose()
                            }
                          }}
                          className={cn(
                            'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                            'hover:scale-[1.02] active:scale-[0.98] relative',
                            active
                              ? 'bg-gradient-to-r from-accent to-accent-hover text-text-inverse shadow-lg shadow-accent/25' 
                              : 'text-text-primary hover:bg-accent/10',
                            collapsed && 'justify-center'
                          )}
                        >
                          {/* New Feature Badge */}
                          {item.isNew && !collapsed && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                          )}

                          <div className="relative">
                            <item.icon className={cn(
                              'flex-shrink-0 transition-all duration-200',
                              collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3',
                              active 
                                ? 'text-text-inverse' 
                                : 'text-text-muted group-hover:text-text-secondary'
                            )} />
                            
                            {/* Notification badge */}
                            {hasBadge && item.badge && item.badge > 0 && (
                              <span className={cn(
                                'absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold text-white',
                                item.name === 'Notifikasi' && unreadNotifications > 0
                                  ? 'bg-error'
                                  : item.name === 'Chat' && unreadMessages > 0
                                  ? 'bg-accent'
                                  : item.name === 'Tugas' && pendingTasks > 0
                                  ? 'bg-warning'
                                  : item.name === 'Pengguna' && pendingApprovals > 0
                                  ? 'bg-accent/80'
                                  : 'bg-text-muted'
                              )}>
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </div>
                          
                          {!collapsed && (
                            <>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="truncate flex items-center">
                                    {item.name}
                                    {item.isNew && (
                                      <span className="ml-2 px-2 py-0.5 text-xs bg-warning/20 text-warning-dark border border-warning/30 rounded-full font-medium">
                                        Baru
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-text-muted group-hover:text-text-secondary truncate mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="ml-2 h-4 w-4 text-text-muted group-hover:text-text-secondary transition-all duration-200 group-hover:translate-x-1" />
                            </>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border bg-gradient-to-r from-accent/5 to-accent/10">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40"
            title={theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-text-secondary" />
            ) : (
              <Sun className="h-4 w-4 text-text-secondary" />
            )}
          </button>
          
          {!collapsed && (
            <span className="text-xs text-text-muted font-medium">
              v1.0.0 DEMO
            </span>
          )}
          
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-error/10 text-error border border-error/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error/40"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-sm font-medium">Keluar</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
