'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  dueDate: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_VALIDATION'
  assignment: 'SPECIFIC' | 'ALL_EMPLOYEES'
  createdAt: string
  createdBy: {
    id: string
    fullName: string
    email: string
  }
  assignee?: {
    id: string
    fullName: string
    email: string
  }
  submissions: any[]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [employees, setEmployees] = useState<any[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignment: 'ALL_EMPLOYEES' as 'SPECIFIC' | 'ALL_EMPLOYEES',
    assigneeId: '',
  })

  useEffect(() => {
    fetchTasks()
    fetchEmployees()
  }, [statusFilter])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/tasks?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setTasks(data.tasks)
      } else {
        console.error('Error fetching tasks:', data.error)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/users?status=APPROVED')
      const data = await response.json()
      
      if (response.ok) {
        setEmployees(data.users.filter((user: any) => user.role === 'EMPLOYEE'))
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchTasks()
        setShowCreateModal(false)
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          assignment: 'ALL_EMPLOYEES',
          assigneeId: '',
        })
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        fetchTasks()
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleValidateTask = async (taskId: string, isValid: boolean) => {
    try {
      const validationMessage = (document.getElementById('validationMessage') as HTMLTextAreaElement)?.value || ''
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: isValid ? 'COMPLETED' : 'IN_PROGRESS',
          validationMessage: validationMessage
        }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchTasks()
        setSelectedTask(null)
        alert(isValid ? 'Tugas berhasil divalidasi dan diselesaikan' : 'Tugas dikembalikan ke status Sedang Dikerjakan')
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      NOT_STARTED: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING_VALIDATION: 'bg-blue-100 text-blue-800'
    }
    
    const labels = {
      NOT_STARTED: 'Belum Dikerjakan',
      IN_PROGRESS: 'Sedang Dikerjakan',
      COMPLETED: 'Selesai',
      PENDING_VALIDATION: 'Menunggu Validasi'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'COMPLETED':
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case 'PENDING_VALIDATION':
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Kelola Tugas</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Semua Status</option>
                <option value="NOT_STARTED">Belum Dikerjakan</option>
                <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                <option value="PENDING_VALIDATION">Menunggu Validasi</option>
                <option value="COMPLETED">Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada tugas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tidak ada tugas yang sesuai dengan pencarian.' : 'Belum ada tugas yang dibuat.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    {getStatusBadge(task.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Penugasan</span>
                    <div className="flex items-center space-x-1">
                      {task.assignment === 'ALL_EMPLOYEES' ? (
                        <Users className="h-3 w-3 text-blue-500" />
                      ) : (
                        <User className="h-3 w-3 text-green-500" />
                      )}
                      <span className="text-xs text-gray-700">
                        {task.assignment === 'ALL_EMPLOYEES' 
                          ? 'Semua Karyawan' 
                          : task.assignee?.fullName || 'Tidak diketahui'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Deadline</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-700">
                          {new Date(task.dueDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Pengumpulan</span>
                    <span className="text-xs font-medium text-blue-600">
                      {task.submissions.length} submission
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Buat Tugas Baru</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Tugas *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan judul tugas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan deskripsi tugas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Penugasan *
                  </label>
                  <select
                    value={formData.assignment}
                    onChange={(e) => setFormData({...formData, assignment: e.target.value as any, assigneeId: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL_EMPLOYEES">Semua Karyawan</option>
                    <option value="SPECIFIC">Karyawan Spesifik</option>
                  </select>
                </div>
                
                {formData.assignment === 'SPECIFIC' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Karyawan *
                    </label>
                    <select
                      value={formData.assigneeId}
                      onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih karyawan</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName} ({employee.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Buat Tugas
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detail Tugas</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedTask.title}</h4>
                  <p className="text-gray-600">{selectedTask.description}</p>
                </div>
                
                {selectedTask.status === 'PENDING_VALIDATION' && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">Validasi Tugas</h5>
                    <p className="text-sm text-blue-700 mb-3">
                      Tugas ini telah dikumpulkan oleh karyawan dan menunggu validasi dari Anda.
                    </p>
                    <div className="flex flex-col space-y-3">
                      <textarea
                        placeholder="Pesan validasi (opsional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        id="validationMessage"
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleValidateTask(selectedTask.id, true)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Validasi & Selesaikan
                        </button>
                        <button
                          onClick={() => handleValidateTask(selectedTask.id, false)}
                          className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                          Kembalikan ke Proses
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Penugasan:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedTask.assignment === 'ALL_EMPLOYEES' 
                        ? 'Semua Karyawan' 
                        : selectedTask.assignee?.fullName || 'Tidak diketahui'
                      }
                    </p>
                  </div>
                  
                  {selectedTask.dueDate && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Deadline:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(selectedTask.dueDate).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Dibuat:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(selectedTask.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                {selectedTask.submissions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Pengumpulan ({selectedTask.submissions.length})
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedTask.submissions.map((submission: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{submission.user.fullName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(submission.submittedAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                          {submission.description && (
                            <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
                          )}
                          {submission.documentUrl && (
                            <a 
                              href={submission.documentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                            >
                              Lihat Dokumen
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

