'use client'

import { useEffect, useState } from 'react'
import { showSuccess, showError, showConfirm } from '@/lib/swal';
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  Calendar,
  User,
  FileText,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Download
} from 'lucide-react'
import TaskFileUpload from '@/components/tasks/TaskFileUpload'
import AdminFileUpload from '@/components/tasks/AdminFileUpload'

interface TaskSubmissionFile { id: string; fileUrl: string; fileName: string; fileSize?: number; fileType?: string }
interface TaskAttachment { id: string; documentId: string; title: string; url: string | null; size: number; mimeType: string; uploadedAt: string | null }
interface TaskSubmission { id: string; taskId: string; userId: string; submittedAt: string; files?: TaskSubmissionFile[] }
interface TaskFeedback { id: string; taskId: string; userId: string; message: string; createdAt: string }
interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'REVISION' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignment: 'SPECIFIC' | 'ALL_EMPLOYEES'
  assigneeId?: string
  assignee?: { id: string; fullName: string; email: string }
  dueDate?: string
  tags: string[]
  createdAt: string
  createdBy: { id: string; fullName: string; email: string }
  submissions?: TaskSubmission[]
  feedbacks?: TaskFeedback[]
  attachments?: TaskAttachment[]
}

interface User { id: string; fullName: string; email: string; role: string; status: string }

export default function AdminTasksPage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as Task['priority'],
    assignment: 'ALL_EMPLOYEES' as Task['assignment'],
    assigneeId: ''
  })
  const [filters, setFilters] = useState({ status: '', priority: '', assignee: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [createForm, setCreateForm] = useState({
    title: '', description: '', dueDate: '', priority: 'MEDIUM' as Task['priority'], assignment: 'ALL_EMPLOYEES' as Task['assignment'], assigneeId: ''
  })
  const [createFiles, setCreateFiles] = useState<File[]>([])
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [allTasksLoaded, setAllTasksLoaded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    fetchTasks(); fetchUsers()
  }, [session, status])

  const fetchTasks = async (loadAll = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (loadAll) {
        params.set('limit', '1000') // Load all tasks
      } else {
        params.set('page', pagination.page.toString())
        params.set('limit', pagination.limit.toString())
      }
      
      // Add filters
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.assignee) params.set('assignee', filters.assignee)
      
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        setAllTasksLoaded(loadAll)
      }
    } finally { 
      setLoading(false) 
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?role=EMPLOYEE&status=APPROVED')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch {}
  }

  const handleCreateTask = async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          dueDate: createForm.dueDate || undefined,
          priority: createForm.priority,
          assignment: createForm.assignment,
          assigneeId: createForm.assignment === 'SPECIFIC' ? createForm.assigneeId : undefined,
          tags: []
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create task')
      }
      
      const json = await res.json()
      const newTaskId: string = json.task?.id

      // Upload any selected files for this new task
      if (newTaskId && createFiles.length > 0) {
        for (const f of createFiles) {
          const fd = new FormData()
          fd.append('taskId', newTaskId)
          fd.append('file', f)
          await fetch('/api/tasks/upload-document', { method: 'POST', body: fd })
        }
      }

      setShowCreate(false)
      setCreateForm({ title: '', description: '', dueDate: '', priority: 'MEDIUM', assignment: 'ALL_EMPLOYEES', assigneeId: '' })
      setCreateFiles([])
      await fetchTasks(true) // Load all tasks after creation
      showSuccess('Berhasil', 'Tugas berhasil dibuat')
    } catch (error) {
      console.error('Error creating task:', error)
      showError('Gagal', error instanceof Error ? error.message : 'Gagal membuat tugas')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const result = await showConfirm("Konfirmasi", 'Hapus tugas ini?', "Ya", "Batal");
    if (!result.isConfirmed) return
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    fetchTasks()
  }

  const handleSubmissionValidation = async (submissionId: string, action: 'approve' | 'reject' | 'revise', feedback?: string) => {
    await fetch(`/api/task-submissions/${submissionId}/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, feedback }) })
    fetchTasks()
  }

  // Enhanced status and priority helpers with better accessibility
  const getPriorityConfig = (p: Task['priority']) => {
    const configs = {
      LOW: { 
        text: 'Rendah', 
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        icon: '🟢'
      },
      MEDIUM: { 
        text: 'Sedang', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        icon: '🟡'
      },
      HIGH: { 
        text: 'Tinggi', 
        color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        icon: '🟠'
      },
      URGENT: { 
        text: 'Urgent', 
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        icon: '🔴'
      }
    }
    return configs[p]
  }

  const getStatusConfig = (s: Task['status']) => {
    const configs = {
      NOT_STARTED: { 
        text: 'Belum Dimulai', 
        color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
        icon: '⏸️'
      },
      IN_PROGRESS: { 
        text: 'Sedang Dikerjakan', 
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        icon: '🔄'
      },
      PENDING_VALIDATION: { 
        text: 'Menunggu Validasi', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        icon: '⏳'
      },
      REVISION: { 
        text: 'Revisi', 
        color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        icon: '🔄'
      },
      COMPLETED: { 
        text: 'Selesai', 
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        icon: '✅'
      }
    }
    return configs[s]
  }

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  }

  const filteredTasks = tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.assignee && t.assigneeId !== filters.assignee) return false
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: tasks.length,
    notStarted: tasks.filter(t => t.status === 'NOT_STARTED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    pendingValidation: tasks.filter(t => t.status === 'PENDING_VALIDATION').length,
    revision: tasks.filter(t => t.status === 'REVISION').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
  }

  if (status === 'loading') return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64" role="status" aria-label="Memuat data tugas">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="sr-only">Memuat...</span>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Enhanced Header with better mobile layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Manajemen Tugas
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Kelola dan validasi tugas karyawan | Total: {pagination.total} tugas | Halaman: {pagination.page}/{pagination.pages}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {!allTasksLoaded && (
                <Button 
                  onClick={() => fetchTasks(true)} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Muat Semua Tugas
                </Button>
              )}
              <Button 
                onClick={() => setShowCreate(v => !v)} 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={showCreate ? 'Tutup form buat tugas' : 'Buat tugas baru'}
              >
                <Plus className="w-4 h-4 mr-2" />
                {showCreate ? 'Tutup' : 'Buat Tugas Baru'}
              </Button>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full sm:w-auto"
                aria-label="Toggle filter options"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Tugas</div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sedang Dikerjakan</div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingValidation}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Menunggu Validasi</div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Selesai</div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.revision}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Revisi</div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Terlambat</div>
              </CardBody>
            </Card>
          </div>

        {showCreate && (
          <div className="bg-card rounded-lg shadow-soft p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Judul Tugas</label>
                  <input 
                    className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.title} 
                    onChange={(e) => setCreateForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Masukkan judul tugas"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Deadline</label>
                  <input 
                    type="date" 
                    className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.dueDate} 
                    onChange={(e) => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Deskripsi Tugas</label>
                <textarea 
                  className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows={4} 
                  value={createForm.description} 
                  onChange={(e) => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Deskripsikan detail tugas yang harus dikerjakan"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Lampiran Tugas (Admin - Tanpa Batas Jumlah File)</label>
                <AdminFileUpload
                  files={createFiles}
                  onFilesChange={setCreateFiles}
                  maxFileSize={10}
                  maxTotalSize={100}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Prioritas</label>
                  <select 
                    className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.priority} 
                    onChange={(e) => setCreateForm(p => ({ ...p, priority: e.target.value as Task['priority'] }))}
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Penugasan</label>
                  <select 
                    className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.assignment} 
                    onChange={(e) => setCreateForm(p => ({ ...p, assignment: e.target.value as Task['assignment'] }))}
                  >
                    <option value="ALL_EMPLOYEES">Semua Karyawan</option>
                    <option value="SPECIFIC">User Tertentu</option>
                  </select>
                </div>
              </div>
              
              {createForm.assignment === 'SPECIFIC' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Pilih Karyawan</label>
                  <select 
                    className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.assigneeId} 
                    onChange={(e) => setCreateForm(p => ({ ...p, assigneeId: e.target.value }))}
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                <Button 
                  onClick={handleCreateTask} 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Tugas
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreate(false)}
                  className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

          {/* Enhanced Filters Section */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardBody className="p-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Cari tugas berdasarkan judul..." 
                    value={filters.search} 
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Cari tugas"
                  />
                </div>

                {/* Collapsible Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select 
                        id="status-filter"
                        value={filters.status} 
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Semua Status</option>
                        <option value="NOT_STARTED">Belum Dimulai</option>
                        <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                        <option value="PENDING_VALIDATION">Menunggu Validasi</option>
                        <option value="REVISION">Revisi</option>
                        <option value="COMPLETED">Selesai</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioritas
                      </label>
                      <select 
                        id="priority-filter"
                        value={filters.priority} 
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))} 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Semua Prioritas</option>
                        <option value="LOW">Rendah</option>
                        <option value="MEDIUM">Sedang</option>
                        <option value="HIGH">Tinggi</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="assignee-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Karyawan
                      </label>
                      <select 
                        id="assignee-filter"
                        value={filters.assignee} 
                        onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))} 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Semua Karyawan</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Enhanced Tasks Table */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardBody className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64" role="status" aria-label="Memuat daftar tugas">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="sr-only">Memuat daftar tugas...</span>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto w-12 h-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Tidak ada tugas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {filters.search || filters.status || filters.priority || filters.assignee 
                      ? 'Tidak ada tugas yang sesuai dengan filter yang dipilih.' 
                      : 'Belum ada tugas yang dibuat.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="task-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tugas
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                          Karyawan
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                          Prioritas
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                          Deadline
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredTasks.map(task => {
                        const statusConfig = getStatusConfig(task.status)
                        const priorityConfig = getPriorityConfig(task.priority)
                        const overdue = isOverdue(task)
                        
                        return (
                          <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {task.title}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                    {task.description}
                                  </div>
                                  {/* Mobile: Show assignee info below title */}
                                  <div className="sm:hidden mt-2">
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <User className="w-3 h-3 mr-1" />
                                      {task.assignee?.fullName || 'Semua Karyawan'}
                                    </div>
                                  </div>
                                </div>
                                {overdue && (
                                  <div className="flex-shrink-0">
                                    <AlertCircle className="w-4 h-4 text-red-500" aria-label="Tugas terlambat" />
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* Desktop: Show assignee in separate column */}
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {task.assignee?.fullName || 'Semua Karyawan'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {task.assignee?.email || ''}
                              </div>
                            </td>
                            
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                <span className="mr-1" aria-hidden="true">{statusConfig.icon}</span>
                                {statusConfig.text}
                              </span>
                            </td>
                            
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityConfig.color}`}>
                                <span className="mr-1" aria-hidden="true">{priorityConfig.icon}</span>
                                {priorityConfig.text}
                              </span>
                            </td>
                            
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                              {task.dueDate ? (
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                  {new Date(task.dueDate).toLocaleDateString('id-ID')}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            
                            <td className="px-2 sm:px-6 py-4 text-sm font-medium">
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                <Button 
                                  onClick={() => setSelectedTask(task)} 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto justify-center"
                                  aria-label={`Lihat detail tugas ${task.title}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="ml-1">Detail</span>
                                </Button>
                                
                                <Button 
                                  onClick={() => {
                                    setEditForm({
                                      id: task.id,
                                      title: task.title,
                                      description: task.description,
                                      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : '',
                                      priority: task.priority,
                                      assignment: task.assignment,
                                      assigneeId: task.assigneeId || ''
                                    });
                                    setShowEdit(true);
                                  }} 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full sm:w-auto justify-center"
                                  aria-label={`Edit tugas ${task.title}`}
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="ml-1">Edit</span>
                                </Button>
                                
                                <Button 
                                  onClick={() => handleDeleteTask(task.id)} 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto justify-center"
                                  aria-label={`Hapus tugas ${task.title}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="ml-1">Hapus</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

        {/* Enhanced Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedTask(null)}
                aria-hidden="true"
              />
              
              {/* Modal Content */}
              <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedTask.title}
                        </h2>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedTask.status).color}`}>
                            <span className="mr-1" aria-hidden="true">{getStatusConfig(selectedTask.status).icon}</span>
                            {getStatusConfig(selectedTask.status).text}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityConfig(selectedTask.priority).color}`}>
                            <span className="mr-1" aria-hidden="true">{getPriorityConfig(selectedTask.priority).icon}</span>
                            {getPriorityConfig(selectedTask.priority).text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTask(null)}
                      className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Tutup detail tugas"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Task Description */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          Deskripsi Tugas
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {selectedTask.description}
                        </p>
                      </div>

                      {/* Assignee Info */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <User className="w-5 h-5 mr-2 text-green-600" />
                          Penugasan
                        </h3>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedTask.assignee?.fullName || 'Semua Karyawan'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {selectedTask.assignee?.email || 'Tugas untuk semua karyawan'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Submissions */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                          Submission Karyawan
                          <span className="ml-2 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-sm">
                            {(selectedTask.submissions || []).length}
                          </span>
                        </h3>
                        
                        {(selectedTask.submissions || []).length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Belum ada submission dari karyawan</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(selectedTask.submissions || []).map((s) => (
                              <div key={s.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Dikirim pada {new Date(s.submittedAt).toLocaleDateString('id-ID')}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(s.submittedAt).toLocaleTimeString('id-ID')}
                                      </p>
                                    </div>
                                  </div>
                                  {selectedTask.status !== 'COMPLETED' && (
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleSubmissionValidation(s.id, 'approve')} 
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Setujui
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => { 
                                          const fb = prompt('Masukkan catatan revisi (opsional)') || undefined; 
                                          handleSubmissionValidation(s.id, 'revise', fb) 
                                        }}
                                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                      >
                                        Minta Revisi
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleSubmissionValidation(s.id, 'reject')}
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                      >
                                        Tolak
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {s.files && s.files.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">File Submission:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {s.files.map((f) => (
                                        <div key={f.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={f.fileName}>
                                              {f.fileName}
                                            </span>
                                          </div>
                                          
                                          {f.fileType?.startsWith('image/') ? (
                                            <div className="mb-2">
                                              <img 
                                                src={f.fileUrl} 
                                                alt={f.fileName} 
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600" 
                                              />
                                            </div>
                                          ) : f.fileType === 'application/pdf' ? (
                                            <div className="mb-2">
                                              <embed 
                                                src={f.fileUrl} 
                                                className="w-full h-32 rounded-lg border border-gray-200 dark:border-gray-600" 
                                                type="application/pdf" 
                                              />
                                            </div>
                                          ) : (
                                            <div className="mb-2 w-full h-32 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                                              <div className="text-center">
                                                <div className="text-3xl mb-2">📄</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Preview tidak tersedia</div>
                                              </div>
                                            </div>
                                          )}
                                          
                                          <a 
                                            href={f.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            download 
                                            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                                          >
                                            <Download className="w-4 h-4 mr-1" />
                                            Unduh File
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Status Management */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                          Kelola Status
                        </h3>
                        <div className="space-y-2">
                          {(['NOT_STARTED','IN_PROGRESS','PENDING_VALIDATION','REVISION','COMPLETED'] as Task['status'][]).map(st => (
                            <Button 
                              key={st} 
                              size="sm" 
                              variant={selectedTask.status === st ? 'default' : 'outline'} 
                              onClick={async () => {
                                await fetch(`/api/tasks/${selectedTask.id}`, { 
                                  method: 'PATCH', 
                                  headers: { 'Content-Type': 'application/json' }, 
                                  body: JSON.stringify({ status: st }) 
                                })
                                fetchTasks()
                              }}
                              className={`w-full justify-start ${
                                selectedTask.status === st 
                                  ? 'bg-blue-600 text-white' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              <span className="mr-2" aria-hidden="true">{getStatusConfig(st).icon}</span>
                              {getStatusConfig(st).text}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Task Attachments */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-amber-600" />
                          Lampiran Tugas
                        </h3>
                        {(selectedTask.attachments && selectedTask.attachments.length > 0) ? (
                          <div className="space-y-3">
                            {selectedTask.attachments.map(att => (
                              <div key={att.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={att.title}>
                                      {att.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {att.mimeType} • {Math.round(att.size/1024)} KB
                                    </p>
                                  </div>
                                  {att.url && (
                                    <a 
                                      href={att.url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-blue-600 hover:text-blue-700 p-1"
                                      aria-label={`Unduh ${att.title}`}
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada lampiran</p>
                          </div>
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                          Informasi Tugas
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dibuat oleh:</p>
                            <p className="text-sm text-gray-900 dark:text-white">{selectedTask.createdBy?.fullName || 'Admin'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal dibuat:</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {new Date(selectedTask.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          {selectedTask.dueDate && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Deadline:</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {new Date(selectedTask.dueDate).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-4xl bg-card rounded-lg shadow-soft max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text-primary">Edit Tugas</h2>
                  <Button variant="outline" onClick={() => setShowEdit(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Tutup
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Judul Tugas</label>
                    <input 
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editForm.title} 
                      onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Masukkan judul tugas"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Deadline</label>
                    <input 
                      type="date" 
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editForm.dueDate} 
                      onChange={(e) => setEditForm(p => ({ ...p, dueDate: e.target.value }))} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Deskripsi Tugas</label>
                  <textarea 
                    className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows={4} 
                    value={editForm.description} 
                    onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Deskripsikan detail tugas yang harus dikerjakan"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Lampiran Tugas (Admin - Tanpa Batas Jumlah File)</label>
                  <AdminFileUpload
                    files={editFiles}
                    onFilesChange={setEditFiles}
                    maxFileSize={10}
                    maxTotalSize={100}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Prioritas</label>
                    <select 
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editForm.priority} 
                      onChange={(e) => setEditForm(p => ({ ...p, priority: e.target.value as Task['priority'] }))}
                    >
                      <option value="LOW">Rendah</option>
                      <option value="MEDIUM">Sedang</option>
                      <option value="HIGH">Tinggi</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Penugasan</label>
                    <select 
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editForm.assignment} 
                      onChange={(e) => setEditForm(p => ({ ...p, assignment: e.target.value as Task['assignment'] }))}
                    >
                      <option value="ALL_EMPLOYEES">Semua Karyawan</option>
                      <option value="SPECIFIC">User Tertentu</option>
                    </select>
                  </div>
                </div>
                
                {editForm.assignment === 'SPECIFIC' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Pilih Karyawan</label>
                    <select 
                      className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editForm.assigneeId} 
                      onChange={(e) => setEditForm(p => ({ ...p, assigneeId: e.target.value }))}
                    >
                      <option value="">-- Pilih Karyawan --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/tasks/${editForm.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: editForm.title,
                            description: editForm.description,
                            dueDate: editForm.dueDate || undefined,
                            priority: editForm.priority,
                            assignment: editForm.assignment,
                            assigneeId: editForm.assignment === 'SPECIFIC' ? editForm.assigneeId : undefined,
                          })
                        });
                        if (!res.ok) throw new Error('failed');
                        // Upload files if any
                        if (editForm.id && editFiles.length > 0) {
                          for (const f of editFiles) {
                            const fd = new FormData()
                            fd.append('taskId', editForm.id)
                            fd.append('file', f)
                            await fetch('/api/tasks/upload-document', { method: 'POST', body: fd })
                          }
                        }
                        setShowEdit(false);
                        setSelectedTask(null);
                        fetchTasks();
                        setEditFiles([])
                        showSuccess('Berhasil', 'Tugas berhasil diperbarui');
                      } catch {
                        showError('Gagal', 'Gagal memperbarui tugas');
                      }
                    }} 
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEdit(false)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  )
}


