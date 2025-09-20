'use client'

import React, { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
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
  Menu, 
  X, 
  FileText,
  UserCheck,
  ChevronRight,
  Search,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  BarChart3,
  DollarSign,
  Clock,
  MapPin,
  Receipt
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
  const { theme, toggle: toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'Manajemen': true,
    'Komunikasi': true,
    'Sistem': true,
    'Kerja': true,
    'Keuangan': true,
    'Profil': true
  })
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !collapsed && !isMobile) {
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

  const pathname = usePathname()
  const isActive = (href: string) => pathname === href

  // Define navigation sections based on role
  const adminNavigationSections: NavigationSection[] = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Ringkasan', href: '/admin', icon: Home, description: 'Ringkasan sistem', isNew: false },
        { name: 'Analitik', href: '/admin/analytics', icon: BarChart3, description: 'Laporan & statistik', isNew: true }
      ]
    },
    {
      title: 'Manajemen',
      items: [
        { name: 'Pengguna', href: '/admin/users', icon: Users, description: 'Manajemen pengguna', badge: pendingApprovals, isNew: false },
        { name: 'Kehadiran', href: '/admin/attendance', icon: UserCheck, description: 'Manajemen kehadiran', isNew: false }
      ]
    },
    {
      title: 'Keuangan',
      items: [
        { name: 'Keuangan', href: '/admin/finance', icon: DollarSign, description: 'Manajemen keuangan', isNew: false },
        { name: 'Invoice', href: '/admin/invoices', icon: Receipt, description: 'Manajemen invoice', isNew: true },
        { name: 'Slip Gaji', href: '/admin/payroll', icon: FileText, description: 'Manajemen slip gaji', isNew: true }
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
        { name: 'Dokumen', href: '/admin/documents', icon: FileText, description: 'Manajemen file', isNew: false }
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
      title: 'Keuangan',
      items: [
        { name: 'Invoice', href: '/employee/invoices', icon: Receipt, description: 'Invoice saya', isNew: true },
        { name: 'Slip Gaji', href: '/employee/payroll', icon: FileText, description: 'Slip gaji saya', isNew: true }
      ]
    },
    {
      title: 'Komunikasi',
      items: [
        { name: 'Chat', href: '/employee/chat', icon: MessageCircle, description: 'Chat tim', badge: unreadMessages, isNew: false },
        { name: 'Notifikasi', href: '/employee/notifications', icon: Bell, description: 'Peringatan saya', badge: unreadNotifications, isNew: false }
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

  // Get sidebar classes based on state
  const getSidebarClasses = () => {
    const baseClasses = [
      'layout-sidebar',
      'flex flex-col',
      'bg-surface border-r border-border',
      'transition-all duration-300 ease-out',
      'h-screen max-h-screen',
      'overflow-visible'
    ]

    if (isMobile) {
      baseClasses.push('fixed left-0 top-0 z-[9999] w-80')
      if (isOpen) {
        baseClasses.push('open')
      }
    } else {
      baseClasses.push('relative')
      if (collapsed) {
        baseClasses.push('collapsed w-20')
      } else {
        baseClasses.push('w-80')
      }
    }

    return baseClasses.join(' ')
  }

  return (
    <aside className={getSidebarClasses()}>
      {/* Header */}
      <div className="sidebar-header flex items-center justify-between px-4 py-4 border-b border-border bg-surface">
        {(!collapsed || isMobile) && (
          <div className="flex items-center space-x-3 min-w-0">
            <img 
              src="/logometa.png" 
              alt="Valpro Logo" 
              className="w-8 h-8 object-contain flex-shrink-0" 
            />
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-text-primary truncate">
                ValproEMS
              </h1>
              <p className="text-xs text-text-secondary truncate">
                {role === 'ADMIN' ? 'Portal Admin' : 'Portal Karyawan'}
              </p>
            </div>
          </div>
        )}
        
        {collapsed && !isMobile && (
          <img 
            src="/logometa.png" 
            alt="Valpro Logo" 
            className="w-6 h-6 object-contain mx-auto" 
          />
        )}
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {isMobile ? (
            <button
              onClick={() => onClose && onClose()}
              className="p-2 rounded-md hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40"
              title="Tutup Sidebar"
              aria-label="Tutup Sidebar"
            >
              <X className="h-4 w-4 text-text-secondary" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-md hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40"
              title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
              aria-label={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {collapsed ? (
                <Menu className="h-4 w-4 text-text-secondary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-text-secondary" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {(!collapsed || isMobile) && (
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-card-hover"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3 text-text-muted" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation - scrollable area */}
      <div className="sidebar-content flex-1 min-h-0 overflow-y-auto py-3">
        {filteredSections.map((section, sectionIndex) => {
          const toggleSection = () => {
            if (!collapsed) {
              setExpandedSections(prev => ({
                ...prev,
                [section.title]: !(prev[section.title])
              }));
            }
          };
          
          const isSectionExpanded = expandedSections[section.title] !== false;
          
          return (
            <div key={sectionIndex} className="mb-4 px-4">
              {(!collapsed || isMobile) ? (
                <div 
                  className="flex items-center justify-between mb-2 cursor-pointer group"
                  onClick={toggleSection}
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors">
                    {section.title}
                  </h3>
                  <ChevronDown 
                    className={cn(
                      "h-3 w-3 text-text-muted group-hover:text-text-secondary transition-all duration-200", 
                      isSectionExpanded ? "rotate-180" : ""
                    )} 
                  />
                </div>
              ) : (
                <div className="h-px my-4 bg-border"></div>
              )}
              
              {(isSectionExpanded || collapsed) && (
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const active = isActive(item.href)
                    
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
                            'group flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200',
                            'hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-accent/40',
                            active 
                              ? 'bg-accent/15 text-accent border border-accent/20 shadow-sm' 
                              : 'text-text-primary hover:text-text-secondary',
                            collapsed && !isMobile && 'justify-center px-2'
                          )}
                          title={collapsed && !isMobile ? item.name : undefined}
                        >
                          <div className="relative flex-shrink-0">
                            <item.icon className={cn(
                              'transition-colors duration-200',
                              collapsed && !isMobile ? 'h-5 w-5' : 'h-4 w-4 mr-3',
                              active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                            )} />
                            {item.badge && item.badge > 0 && (
                              <span className={cn(
                                'absolute -top-1 -right-1 bg-error text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1',
                                collapsed && !isMobile ? 'text-[10px]' : 'text-xs'
                              )}>
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </div>
                          
                          {(!collapsed || isMobile) && (
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <span className="truncate font-medium">
                                {item.name}
                              </span>
                              {item.isNew && (
                                <span className="ml-2 bg-success text-white text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                  Baru
                                </span>
                              )}
                            </div>
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

      {/* Footer actions - always visible and properly spaced */}
      <div className="sidebar-footer px-4 py-4 border-t border-border bg-surface">
        <div className={cn(
          "flex items-center",
          collapsed && !isMobile ? "justify-center" : "justify-between"
        )}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "p-2.5 rounded-lg hover:bg-card-hover transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent/40",
              "flex items-center justify-center"
            )}
            title={theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
            aria-label={theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-text-secondary" />
            ) : (
              <Sun className="h-4 w-4 text-text-secondary" />
            )}
            {(!collapsed || isMobile) && (
              <span className="ml-2 text-sm text-text-secondary">
                {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              </span>
            )}
          </button>
          
          {/* Version info - only show when expanded */}
          {(!collapsed || isMobile) && (
            <span className="text-xs text-text-muted font-mono">v1.0.0</span>
          )}
          
          {/* Logout button */}
          <button
            onClick={() => signOut({ 
              callbackUrl: typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/login`
                : 'https://crm.valprointertech.com/auth/login'
            })}
            className={cn(
              "flex items-center justify-center px-3 py-2.5 rounded-lg",
              "hover:bg-error/10 text-error border border-error/30",
              "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error/30",
              collapsed && !isMobile && "px-2.5"
            )}
            title="Keluar dari Sistem"
            aria-label="Keluar dari Sistem"
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && (
              <span className="ml-2 text-sm font-medium">Keluar</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

