'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Users,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FolderKanban,
  Building2,
  BarChart3,
  Grid3X3,
  CheckSquare,
  TrendingUp
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  contact: {
    id: string
    fullName: string
    companyName?: string
    clientStatus: string
  }
  serviceType: string
  startDate: string
  endDate: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    fullName: string
    email: string
  }
  members: Array<{
    id: string
    userId: string
    role?: string
    user: {
      id: string
      fullName: string
      email: string
      role: string
    }
  }>
  milestones: Array<{
    id: string
    name: string
    status: string
    startDate: string
    endDate: string
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate?: string
    assigneeId?: string
  }>
  _count: {
    members: number
    milestones: number
    tasks: number
  }
}

export default function EmployeeProjectsPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    loadProjects()
  }, [session, status, search, filterStatus])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        memberOnly: 'true'
      })
      
      if (search) params.append('search', search)
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`/api/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects)
      } else {
        showToast('Gagal memuat proyek', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'ONGOING':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <Clock className="h-4 w-4" />
      case 'ONGOING':
        return <Target className="h-4 w-4" />
      case 'ON_HOLD':
        return <AlertTriangle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getProgressPercentage = (project: Project) => {
    if (!project.milestones || project.milestones.length === 0) return 0
    
    const completedMilestones = project.milestones.filter(m => {
      const status = m.status?.toUpperCase()
      return status === 'COMPLETED' || status === 'FINISHED' || status === 'DONE'
    }).length
    
    return Math.round((completedMilestones / project.milestones.length) * 100)
  }

  const getMyRole = (project: Project) => {
    const member = project.members.find(m => m.userId === session?.user?.id)
    return member?.role || 'Team Member'
  }

  const getMyTasks = (project: Project) => {
    if (!project.tasks) return []
    return project.tasks.filter(task => task.assigneeId === session?.user?.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (status === 'loading') {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FolderKanban className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proyek Saya</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat dan kelola proyek yang ditugaskan kepada Anda
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Proyek</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sedang Berjalan</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'ONGOING').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tugas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {projects.reduce((acc, p) => acc + getMyTasks(p).length, 0)}
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {projects.length > 0 
                    ? Math.round(projects.reduce((acc, p) => acc + getProgressPercentage(p), 0) / projects.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-2/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari proyek, klien, atau layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Status</option>
                <option value="PLANNING">Perencanaan</option>
                <option value="ONGOING">Sedang Berjalan</option>
                <option value="ON_HOLD">Ditahan</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>

              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Belum ada proyek
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Anda belum ditugaskan ke proyek manapun
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {project.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      {getMyRole(project)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.contact.fullName}
                        {project.contact.companyName && ` (${project.contact.companyName})`}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.serviceType}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span>{project.status}</span>
                    </span>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{project._count.members}</span>
                    </div>
                  </div>

                  {/* My Tasks Summary */}
                  {getMyTasks(project).length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tugas Saya</span>
                        <span className="text-xs text-gray-500">{getMyTasks(project).length} tugas</span>
                      </div>
                      <div className="space-y-1">
                        {getMyTasks(project).slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                              {task.title}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                        {getMyTasks(project).length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{getMyTasks(project).length - 3} tugas lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {project.milestones && project.milestones.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{getProgressPercentage(project)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(project)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Days Remaining */}
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      {getDaysRemaining(project.endDate) > 0 
                        ? `${getDaysRemaining(project.endDate)} hari tersisa`
                        : getDaysRemaining(project.endDate) === 0
                        ? 'Deadline hari ini'
                        : `${Math.abs(getDaysRemaining(project.endDate))} hari terlambat`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Proyek
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Klien
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Layanan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tugas Saya
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {project.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {project.contact.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {project.contact.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {project.serviceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(project.startDate)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(project.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 w-fit ${getStatusColor(project.status)}`}>
                            {getStatusIcon(project.status)}
                            <span>{project.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                            {getMyRole(project)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getMyTasks(project).length} tugas
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${getProgressPercentage(project)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getProgressPercentage(project)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}
