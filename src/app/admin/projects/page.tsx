'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Building,
  User,
  Clock,
  Edit,
  Trash2,
  Eye,
  FileText,
  Grid3X3,
  List,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import ProjectModal from '@/components/projects/ProjectModal'
import ProjectTasksModal from '@/components/projects/ProjectTasksModal'

type Project = {
  id: string
  name: string
  description?: string
  serviceType: string
  startDate: string
  endDate: string
  status: 'ONGOING' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  createdAt: string
  updatedAt: string
  contact: {
    id: string
    fullName: string
    companyName?: string
    clientStatus: string
  }
  createdBy: { id: string; fullName: string; email: string }
  members: Array<{
    id: string
    role?: string
    user: { id: string; fullName: string; email: string; role: string }
  }>
  milestones: Array<{
    id: string
    name: string
    status: string
    startDate: string
    endDate: string
  }>
  _count: { members: number; milestones: number }
}

export default function AdminProjectsPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<Project | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    loadProjects()
  }, [session, status, search, filterStatus, filterServiceType, pagination.page])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (search) params.append('search', search)
      if (filterStatus) params.append('status', filterStatus)
      if (filterServiceType) params.append('serviceType', filterServiceType)

      const res = await fetch(`/api/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects)
        setPagination(data.pagination)
      } else {
        showToast('Gagal memuat projects', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus project ini?')) return

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Project berhasil dihapus', { type: 'success' })
        loadProjects()
      } else {
        showToast('Gagal menghapus project', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    }
  }

  const handleCreateProject = async (projectData: any) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (res.ok) {
        showToast('Project berhasil dibuat', { type: 'success' })
        setShowCreateModal(false)
        loadProjects()
      } else {
        const error = await res.json()
        showToast(error.message || 'Gagal membuat project', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    }
  }

  const handleUpdateProject = async (projectData: any) => {
    if (!editingProject) return

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (res.ok) {
        showToast('Project berhasil diperbarui', { type: 'success' })
        setEditingProject(null)
        loadProjects()
      } else {
        const error = await res.json()
        showToast(error.message || 'Gagal memperbarui project', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ONGOING': return 'Berlangsung'
      case 'PENDING': return 'Tertunda'
      case 'COMPLETED': return 'Selesai'
      case 'CANCELLED': return 'Dibatalkan'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONGOING': return <Clock className="w-4 h-4" />
      case 'PENDING': return <AlertCircle className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getProgressPercentage = (project: Project) => {
    if (project.milestones.length === 0) return 0
    const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length
    return Math.round((completedMilestones / project.milestones.length) * 100)
  }

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date() && new Date(endDate).toDateString() !== new Date().toDateString()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Manajemen Project
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Kelola project legalitas untuk klien
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {viewMode === 'grid' ? (
                <>
                  <List className="w-4 h-4" />
                  List
                </>
              ) : (
                <>
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Buat Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Project</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Berlangsung</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projects.filter(p => p.status === 'ONGOING').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Selesai</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projects.filter(p => p.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Terlambat</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projects.filter(p => p.status === 'ONGOING' && isOverdue(p.endDate)).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                placeholder="Cari project..."
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="ONGOING">Berlangsung</option>
                <option value="PENDING">Tertunda</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
              <input
                placeholder="Filter layanan"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={filterServiceType}
                onChange={e => setFilterServiceType(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Projects Display */}
        {loading ? (
          <Card className="p-8">
            <div className="text-center">
              <LoadingSpinner size="xl" variant="primary" className="mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Memuat projects...</p>
            </div>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada project</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Mulai buat project untuk mengelola layanan legalitas klien
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Project Pertama
              </Button>
            </div>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {projects.map((project) => (
              viewMode === 'grid' ? (
                <Card key={project.id} className="p-4 hover:shadow-lg transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(project.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {getStatusLabel(project.status)}
                          </span>
                        </Badge>
                        {isOverdue(project.endDate) && project.status === 'ONGOING' && (
                          <Badge variant="danger">Terlambat!</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Building className="w-4 h-4" />
                      <span>{project.contact.fullName}</span>
                      {project.contact.companyName && <span>• {project.contact.companyName}</span>}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <FileText className="w-4 h-4" />
                      <span>{project.serviceType}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.startDate).toLocaleDateString('id-ID')} - {new Date(project.endDate).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4" />
                      <span>{project._count.members} anggota • {project._count.milestones} milestone</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(project)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {project.createdBy.fullName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProject(project)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {getStatusLabel(project.status)}
                          </span>
                        </Badge>
                        {isOverdue(project.endDate) && project.status === 'ONGOING' && (
                          <Badge variant="danger">Terlambat!</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {project.contact.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {project.serviceType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project._count.members} anggota
                        </span>
                        <span>{getProgressPercentage(project)}% selesai</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProjectForTasks(project)
                          setShowTasksModal(true)
                        }}
                        title="View Tasks"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProject(project)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}

        {/* Project Modal */}
        <ProjectModal
          isOpen={showCreateModal || !!editingProject}
          onClose={() => {
            setShowCreateModal(false)
            setEditingProject(null)
          }}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          project={editingProject}
          isLoading={loading}
        />

        {/* Project Tasks Modal */}
        {selectedProjectForTasks && (
          <ProjectTasksModal
            isOpen={showTasksModal}
            onClose={() => {
              setShowTasksModal(false)
              setSelectedProjectForTasks(null)
            }}
            projectId={selectedProjectForTasks.id}
            projectName={selectedProjectForTasks.name}
            contactId={selectedProjectForTasks.contact?.id}
          />
        )}
      </div>
    </AdminLayout>
  )
}
