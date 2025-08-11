'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/layout/AdminLayout'
import TransactionChart from '@/components/TransactionChart'
import { Users, UserCheck, UserX, CheckSquare, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  rejectedUsers: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  })
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch real data from APIs
      const [usersResponse, tasksResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/tasks')
      ])

      let userStats = {
        totalUsers: 0,
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0
      }
      
      let taskStats = {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0
      }

      // Process users data
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const users = usersData.users || []
        
        userStats = {
          totalUsers: users.length,
          pendingUsers: users.filter((user: any) => user.status === 'PENDING').length,
          approvedUsers: users.filter((user: any) => user.status === 'APPROVED').length,
          rejectedUsers: users.filter((user: any) => user.status === 'REJECTED').length
        }
      } else {
        console.error('Error fetching users:', usersResponse.statusText)
      }
      
      // Process tasks data
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        const tasks = tasksData.tasks || []
        
        taskStats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((task: any) => task.status === 'COMPLETED').length,
          pendingTasks: tasks.filter((task: any) => task.status === 'IN_PROGRESS' || task.status === 'NOT_STARTED').length
        }
      } else {
        console.error('Error fetching tasks:', tasksResponse.statusText)
      }

      // Update stats with real data
      setStats({
        ...userStats,
        ...taskStats
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Karyawan',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Menunggu Persetujuan',
      value: stats.pendingUsers,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Karyawan Aktif',
      value: stats.approvedUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Tugas',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ]

  const completionPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Selamat Datang, {session?.user.name}
          </h1>
          <p className="text-gray-600">
            Ini adalah dashboard admin untuk mengelola sistem Valpro.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <card.icon className="h-10 w-10 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="space-y-3">
              <Link href="/admin/users/pending">
                <div
                  className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Persetujuan Registrasi</p>
                    <p className="text-sm text-gray-600">{stats.pendingUsers} karyawan menunggu persetujuan</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/tasks">
                <div
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <CheckSquare className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Kelola Tugas</p>
                    <p className="text-sm text-gray-600">Buat dan kelola tugas karyawan</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Tugas</h3>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Selesai</span>
              <span className="font-semibold text-green-600">{stats.completedTasks}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Dalam Progress</span>
              <span className="font-semibold text-yellow-600">{stats.pendingTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${completionPercentage}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {completionPercentage}% tugas selesai
            </p>
          </div>
        </div>

        {/* Transaction Charts */}
        <TransactionChart />
      </div>
    </AdminLayout>
  )
}

