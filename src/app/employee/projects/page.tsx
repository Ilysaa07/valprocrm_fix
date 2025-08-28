'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  FolderKanban, 
  Search, 
  Calendar, 
  Users, 
  Building,
  User,
  Clock,
  Eye,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  ClipboardList
} from 'lucide-react'
import ProjectTasksModal from '@/components/projects/ProjectTasksModal'

type Project = {
  id: string
  name: string
  description?: string
  serviceType: string
  startDate: string
  endDate: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  budget?: number
  createdAt: string
  updatedAt: string
  contact: {
    id: string
    firstName: string
    lastName: string
    company?: string
  }
  members: Array<{
    id: string
    userId: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  milestones: Array<{
    id: string
    title: string
    description?: string
    dueDate: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  }>
  _count: { members: number; milestones: number }
}

export default function EmployeeProjectsPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<Project | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role === 'ADMIN') redirect('/admin')
    loadProjects()
  }, [session, status, search, filterStatus])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (search) params.append('search', search)
      if (filterStatus) params.append('status', filterStatus)
      params.append('memberOnly', 'true') // Only show projects where user is a member

      const res = await fetch(`/api/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      } else {
        showToast('Failed to load projects', { type: 'error' })
      }
    } catch (error) {
      showToast('An error occurred', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING': return <FileText className="w-4 h-4" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />
      case 'ON_HOLD': return <AlertCircle className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(selectedProject?.status || '')
  }

  const getCompletedMilestones = (milestones: Project['milestones']) => {
    return milestones.filter(m => m.status === 'COMPLETED').length
  }

  const getProgressPercentage = (milestones: Project['milestones']) => {
    if (milestones.length === 0) return 0
    return Math.round((getCompletedMilestones(milestones) / milestones.length) * 100)
  }

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Projects you are assigned to
            </p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projects.filter(p => p.status === 'IN_PROGRESS').length}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projects.filter(p => p.status === 'IN_PROGRESS' && isOverdue(p.endDate)).length}
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
                placeholder="Search projects..."
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
                <option value="">All Status</option>
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderKanban className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Projects Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You are not assigned to any projects yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(project.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(project.status)}
                          {project.status.replace('_', ' ')}
                        </div>
                      </Badge>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Building className="w-4 h-4 mr-2" />
                    {project.contact.firstName} {project.contact.lastName}
                    {project.contact.company && ` (${project.contact.company})`}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    {project._count.members} team member{project._count.members !== 1 ? 's' : ''}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Target className="w-4 h-4 mr-2" />
                    {getCompletedMilestones(project.milestones)}/{project.milestones.length} milestones
                  </div>

                  {/* Progress Bar */}
                  {project.milestones.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{getProgressPercentage(project.milestones)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(project.milestones)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProjectForTasks(project)
                        setShowTasksModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                    >
                      <ClipboardList className="w-4 h-4" />
                      View Tasks
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Project Details
                </h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedProject.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getStatusColor(selectedProject.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedProject.status)}
                        {selectedProject.status.replace('_', ' ')}
                      </div>
                    </Badge>
                    <Badge className={getPriorityColor(selectedProject.priority)}>
                      {selectedProject.priority}
                    </Badge>
                  </div>
                  {selectedProject.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedProject.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Client Information</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedProject.contact.firstName} {selectedProject.contact.lastName}
                      {selectedProject.contact.company && (
                        <span className="block text-sm">{selectedProject.contact.company}</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(selectedProject.startDate)} - {formatDate(selectedProject.endDate)}
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Team Members</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProject.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                {selectedProject.milestones.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Milestones</h4>
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="mt-1">
                            {milestone.status === 'COMPLETED' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : milestone.status === 'IN_PROGRESS' ? (
                              <Clock className="w-5 h-5 text-blue-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              {milestone.title}
                            </h5>
                            {milestone.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {milestone.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Due: {formatDate(milestone.dueDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
    </EmployeeLayout>
  )
}
