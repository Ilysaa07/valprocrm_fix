'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import TaskModal from '@/components/tasks/TaskModal'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignment: 'SPECIFIC' | 'ALL_EMPLOYEES'
  assigneeId?: string
  assignee?: string
  dueDate?: string
  tags: string[]
  createdAt: string
  createdBy: {
    id: string
    fullName: string
    email: string
  }
}

interface User {
  id: string
  fullName: string
  email: string
  role: string
  status: string
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    search: ''
  })
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAll = (ids: string[]) => setSelectedIds(new Set(ids))
  const clearSelection = () => setSelectedIds(new Set())

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user?.id) {
      redirect('/auth/signin')
    }

    if (session.user.role !== 'ADMIN') {
      redirect('/employee')
    }

    fetchTasks()
    fetchUsers()
  }, [session, status])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=EMPLOYEE&status=APPROVED')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
      }
    } catch (error) {
    }
  }

  const handleTaskCreate = async (taskData: Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        const result = await response.json()
        setTasks(prev => [...prev, result.task])
        setIsModalOpen(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal membuat tugas')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const result = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.task : task
        ))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal memperbarui tugas')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const bulkUpdateStatus = async (newStatus: Task['status']) => {
    if (selectedIds.size === 0) return
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(
        ids.map(id => fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }))
      )
      // Refresh tasks
      await fetchTasks()
      clearSelection()
      alert(`Berhasil memperbarui ${ids.length} tugas ke ${newStatus}`)
    } catch (e) {
      alert('Gagal melakukan bulk update')
    }
  }

  const bulkValidatePending = async () => {
    if (selectedIds.size === 0) return
    try {
      const ids = Array.from(selectedIds)
      // Only validate those currently pending
      const pendingIds = tasks.filter(t => ids.includes(t.id) && t.status === 'PENDING_VALIDATION').map(t => t.id)
      await Promise.all(
        pendingIds.map(id => fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' })
        }))
      )
      await fetchTasks()
      clearSelection()
      alert(`Berhasil memvalidasi ${pendingIds.length} tugas`)
    } catch (e) {
      alert('Gagal memvalidasi tugas')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal menghapus tugas')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const openCreateModal = () => {
    setEditingTask(undefined)
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(undefined)
  }

  const filteredTasks = tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.assignee && task.assigneeId !== filters.assignee) return false
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const getTaskStats = () => {
    const total = tasks.length
    const notStarted = tasks.filter(t => t.status === 'NOT_STARTED').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const pendingValidation = tasks.filter(t => t.status === 'PENDING_VALIDATION').length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length

    return { total, notStarted, inProgress, pendingValidation, completed, overdue }
  }

  const stats = getTaskStats()

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Tugas</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Kelola dan pantau semua tugas tim Anda
            </p>
          </div>
          <Button 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Buat Tugas
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.notStarted}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Belum Dimulai</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Sedang Berlangsung</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingValidation}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Menunggu Validasi</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Selesai</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Overdue</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Semua Status</option>
                  <option value="NOT_STARTED">Belum Dimulai</option>
                  <option value="IN_PROGRESS">Sedang Berlangsung</option>
                  <option value="PENDING_VALIDATION">Menunggu Validasi</option>
                  <option value="COMPLETED">Selesai</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Semua Prioritas</option>
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Mendesak</option>
                </select>

                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Semua Karyawan</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bulk actions bar (only in list view) */}
            {viewMode === 'list' && (
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Dipilih: {selectedIds.size} tugas
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => bulkUpdateStatus('IN_PROGRESS')}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Jadikan Sedang Berlangsung
                  </button>
                  <button
                    onClick={() => bulkUpdateStatus('NOT_STARTED')}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-300 text-gray-800 hover:bg-gray-400 disabled:opacity-50"
                  >
                    Kembalikan ke Belum Dimulai
                  </button>
                  <button
                    onClick={bulkValidatePending}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Validasi (PENDING → COMPLETED)
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                  >
                    Bersihkan Pilihan
                  </button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Task Board */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          viewMode === 'kanban' ? (
            <KanbanBoard
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskCreate={handleTaskCreate}
              onTaskDelete={handleTaskDelete}
            />
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && filteredTasks.every(t => selectedIds.has(t.id)) && filteredTasks.length > 0}
                        onChange={(e) => e.target.checked ? selectAll(filteredTasks.map(t => t.id)) : clearSelection()}
                      />
                    </th>
                    <th className="p-3">Judul</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Prioritas</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 align-top">
                        <input
                          type="checkbox"
                          checked={isSelected(task.id)}
                          onChange={() => toggleSelect(task.id)}
                        />
                      </td>
                      <td className="p-3 align-top">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                        <div className="text-gray-500 dark:text-gray-400 line-clamp-2 max-w-md">{task.description}</div>
                      </td>
                      <td className="p-3 align-top">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                          {task.status}
                        </span>
                      </td>
                      <td className="p-3 align-top">{task.priority}</td>
                      <td className="p-3 align-top">{task.assignee || '-'}</td>
                      <td className="p-3 align-top">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="p-3 align-top space-x-2">
                        <button
                          onClick={() => handleTaskUpdate(task.id, { status: 'IN_PROGRESS' })}
                          className="px-2 py-1 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleTaskUpdate(task.id, { status: 'PENDING_VALIDATION' })}
                          className="px-2 py-1 rounded-md text-xs bg-amber-500 text-white hover:bg-amber-600"
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleTaskUpdate(task.id, { status: 'COMPLETED' })}
                          className="px-2 py-1 rounded-md text-xs bg-green-600 text-white hover:bg-green-700"
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        task={editingTask}
        onSave={editingTask ? (taskData) => handleTaskUpdate(editingTask.id, taskData) : handleTaskCreate}
        users={users}
      />
    </AdminLayout>
  )
}

