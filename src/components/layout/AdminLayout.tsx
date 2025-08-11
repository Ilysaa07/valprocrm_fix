'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import Image from 'next/image'

import NotificationDropdown from '../NotificationDropdown'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Kelola Karyawan', href: '/admin/users', icon: Users },
  { name: 'Kelola Tugas', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Keuangan', href: '/admin/finance', icon: DollarSign },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  const renderNavLink = (item: typeof navigation[0]) => {
    const isActive = pathname === item.href
    const baseClass =
      'group flex items-center px-2 py-2 text-sm font-medium rounded-xl transition-all'
    const activeClass = 'bg-blue-100 text-blue-900 shadow'
    const inactiveClass = 'text-gray-700 hover:bg-gray-100 hover:text-black'

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {item.name}
      </Link>
    )
  }

  const renderUserInfo = () => (
    <div className="flex items-center">
      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
        {session?.user.image ? (
          <img src={session.user.image} alt={session?.user.name || ''} className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-blue-600" />
        )}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">
          {session?.user.name}
        </p>
        <p className="text-xs text-gray-500">Administrator</p>
      </div>
    </div>
  )

  const renderLogoutButton = () => (
    <button
      onClick={() => signOut()}
      className="mt-3 w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
    >
      <LogOut className="mr-3 h-4 w-4" />
      Keluar
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="relative h-10 w-40 sm:h-12 sm:w-48">
              <Image
                src="/valprologo.webp"
                alt="Valpro Intertech"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 160px, 200px"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map(renderNavLink)}
          </nav>
          <div className="border-t border-gray-200 p-4">
            {renderUserInfo()}
            {renderLogoutButton()}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200 shadow">
        {/* Centered logo */}
        <div className="flex h-32 items-center justify-center border-b border-gray-200 px-4">
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
        <nav className="flex-1 space-y-1 px-2 py-4">{navigation.map(renderNavLink)}</nav>
        <div className="border-t border-gray-200 p-4">
          {renderUserInfo()}
          {renderLogoutButton()}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200 shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 lg:px-6 items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name ||
                'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  {session?.user.image ? (
                    <img src={session.user.image} alt={session?.user.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {session?.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
