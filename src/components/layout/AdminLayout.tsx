'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  Users,
  CheckSquare,
  LogOut,
  User,
  DollarSign,
  FileText,
  MessageCircle,
  Bell,
  Settings,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import Image from 'next/image'

import NotificationDropdown from '../NotificationDropdown'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Badge from '@/components/ui/Badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/providers/ToastProvider'
import SocketClient from '@/lib/socket'
import { io, Socket } from 'socket.io-client'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Kelola Karyawan', href: '/admin/users', icon: Users },
  { name: 'Kelola Tugas', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Keuangan', href: '/admin/finance', icon: DollarSign },
  { name: 'Kehadiran', href: '/admin/attendance', icon: Calendar },
  { name: 'Pengajuan Izin', href: '/admin/leave-requests', icon: ClipboardList },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const { showToast } = useToast()

  // Realtime toast for attendance and leave events
  useEffect(() => {
    let s: Socket | null = null
    try {
      const g = (window as unknown as { socket?: Socket }).socket
      s = g || io()
      s.on('attendance_check_in', (p: { userId: string; status: string; userName?: string }) => {
        const name = p.userName || 'Karyawan'
        showToast(`${name} check-in (${p.status})`, { title: 'Kehadiran', type: 'info', duration: 3000, idKey: `ci-${p.userId}-${Date.now()}` })
      })
      s.on('attendance_check_out', (p: { userId: string; userName?: string }) => {
        const name = p.userName || 'Karyawan'
        showToast(`${name} check-out`, { title: 'Kehadiran', type: 'info', duration: 3000, idKey: `co-${p.userId}-${Date.now()}` })
      })
      s.on('leave_request_created', () => {
        showToast('Pengajuan izin baru masuk', { title: 'Pengajuan Izin', type: 'info', duration: 3500, idKey: `lr-${Date.now()}` })
      })
      // Presence notifications
      s.on('user_online', (p: { userId: string; name?: string; role?: string }) => {
        const who = p.name || 'Pengguna'
        showToast(`${who} online`, { title: 'Presence', type: 'success', duration: 2000, idKey: `on-${p.userId}` })
      })
      s.on('user_offline', (p: { userId: string; name?: string; role?: string }) => {
        const who = p.name || 'Pengguna'
        showToast(`${who} offline`, { title: 'Presence', type: 'warning', duration: 2000, idKey: `off-${p.userId}` })
      })
    } catch {}
    return () => {
      try {
        s?.off('attendance_check_in')
        s?.off('attendance_check_out')
        s?.off('leave_request_created')
        s?.off('user_online')
        s?.off('user_offline')
        if (!(window as any).socket) s?.disconnect()
      } catch {}
    }
  }, [showToast])

  useEffect(() => {
    const socket = SocketClient.getSocket()
    
    return () => {
      SocketClient.disconnect()
    }
  }, [])

  const renderNavLink = (item: typeof navigation[0]) => {
    const isActive = pathname === item.href
    const baseClass =
      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200'
    const activeClass = 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
    const inactiveClass = 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
        }`} />
        {item.name}
        {isActive && (
          <Badge variant="default" className="ml-auto text-xs bg-blue-100 text-blue-700">
            Active
          </Badge>
        )}
      </Link>
    )
  }

  const renderUserInfo = () => (
    <div className="flex items-center p-3">
      <Avatar className="w-10 h-10">
        <AvatarImage src={session?.user?.image} alt={session?.user?.name || ''} />
        <AvatarFallback className="bg-blue-100 text-blue-600">
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {session?.user?.name}
        </p>
        <p className="text-xs text-gray-500">Administrator</p>
      </div>
    </div>
  )

  const renderLogoutButton = () => (
    <Button
      onClick={() => signOut()}
      variant="outline"
      size="sm"
      className="w-full mt-2 text-gray-700 hover:text-red-600 hover:border-red-200"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Keluar
    </Button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-2xl">
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="relative h-10 w-40">
              <Image
                src="/valprologo.webp"
                alt="Valpro Intertech"
                fill
                className="object-contain"
                priority
                sizes="160px"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map(renderNavLink)}
          </nav>
          <div className="border-t border-gray-200 p-3">
            {renderUserInfo()}
            {renderLogoutButton()}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col bg-white border-r border-gray-200 shadow-lg">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-gray-200 px-6">
          <div className="relative h-12 w-48">
            <Image
              src="/valprologo.webp"
              alt="Valpro Intertech"
              fill
              className="object-contain"
              priority
              sizes="200px"
            />
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation.map(renderNavLink)}
        </nav>
        
        {/* User Info */}
        <div className="border-t border-gray-200 p-3">
          {renderUserInfo()}
          {renderLogoutButton()}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="ml-4 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-1 justify-between px-4 lg:px-6 items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500">Welcome back, {session?.user?.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="p-2">
                  <Settings className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session?.user?.image} alt={session?.user?.name || ''} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    {session?.user?.name}
                  </span>
                </div>
                
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="hidden md:flex"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
