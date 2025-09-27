'use client'

import { useState, useEffect } from 'react'
import { showError } from '@/lib/swal';
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircle,
  Clock,
  FileText,
  Upload,
  Eye,
  X,
  Download
} from 'lucide-react'
import TaskFileUpload from '@/components/tasks/TaskFileUpload'
// Inline submission UI; legacy modal removed

interface TaskAttachment { id: string; documentId: string; title: string; url: string | null; size: number; mimeType: string; uploadedAt: string | null }

interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'REVISION' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignment: 'SPECIFIC' | 'ALL_EMPLOYEES'
  assigneeId?: string
  assignee?: {
    id: string
    fullName: string
    email: string
  }
  dueDate?: string
  tags: string[]
  createdAt: string
  createdBy: {
    id: string
    fullName: string
    email: string
  }
  submissions?: TaskSubmission[]
  feedbacks?: TaskFeedback[]
  validationMessage?: string
  attachments?: TaskAttachment[]
}

interface TaskSubmission {
  id: string
  taskId: string
  userId: string
  description?: string
  submittedAt: string
  files?: Array<{ id: string; fileUrl: string; fileName: string; fileSize?: number; fileType?: string }>
}

interface TaskFeedback {
  id: string
  taskId: string
  userId: string
  message: string
  createdAt: string
}

export default function EmployeeTasksPage() {
  const { data: session, status } = useSession()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitDesc, setSubmitDesc] = useState('')
  const [submitFiles, setSubmitFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned')
  const [attSearch, setAttSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [allTasksLoaded, setAllTasksLoaded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user?.id) {
      redirect('/auth/signin')
    }

    if (session.user.role !== 'EMPLOYEE') {
      redirect('/admin')
    }

    fetchTasks()
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
      
      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        setAllTasksLoaded(loadAll)
      } else {
        console.error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' })
      })
      
      if (response.ok) {
        await fetchTasks()
      } else {
        console.error('Failed to start task')
      }
    } catch (error) {
      console.error('Error starting task:', error)
    }
  }

  const handleUpdateStatus = async (taskId: string, status: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        await fetchTasks()
        if (selectedTask && selectedTask.id === taskId) {
          // refresh selected task view
          const updated = (await (await fetch(`/api/tasks/${taskId}`)).json()).task
          setSelectedTask(updated)
        }
      }
    } catch (e) {
      console.error('Failed to update status', e)
    }
  }

  const handleSubmitTask = async () => {
    if (!selectedTask) return
    try {
      setSubmitting(true)
      const fd = new FormData()
      fd.append('taskId', selectedTask.id)
      fd.append('content', submitDesc || '-')
      submitFiles.forEach(f => fd.append('attachments', f))
      const res = await fetch('/api/task-submissions', { method: 'POST', body: fd })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'submit failed')
      }
      setSubmitDesc('')
      setSubmitFiles([])
      setSelectedTask(null)
      fetchTasks()
    } catch (e) {
      console.error(e)
      await showError("Error!", `Gagal submit: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'LOW': return 'bg-success/20 text-success-dark border-success/30'
      case 'MEDIUM': return 'bg-warning/20 text-warning-dark border-warning/30'
      case 'HIGH': return 'bg-warning/30 text-warning-dark border-warning/40'
      case 'URGENT': return 'bg-error/20 text-error-dark border-error/30'
      default: return 'bg-surface text-text-secondary border-border'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-surface text-text-secondary border-border'
      case 'IN_PROGRESS': return 'bg-accent/20 text-accent-dark border-accent/30'
      case 'PENDING_VALIDATION': return 'bg-warning/20 text-warning-dark border-warning/30'
      case 'REVISION': return 'bg-warning/30 text-warning-dark border-warning/40'
      case 'COMPLETED': return 'bg-success/20 text-success-dark border-success/30'
      default: return 'bg-surface text-text-secondary border-border'
    }
  }

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'NOT_STARTED': return 'Belum Dimulai'
      case 'IN_PROGRESS': return 'Sedang Dikerjakan'
      case 'PENDING_VALIDATION': return 'Menunggu Validasi'
      case 'REVISION': return 'Revisi'
      case 'COMPLETED': return 'Selesai'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  const daysRemaining = (dateString?: string) => {
    if (!dateString) return null
    const now = new Date()
    const due = new Date(dateString)
    const diffMs = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const statusProgress = (status: Task['status']) => {
    switch (status) {
      case 'NOT_STARTED': return 0
      case 'IN_PROGRESS': return 50
      case 'REVISION': return 60
      case 'PENDING_VALIDATION': return 75
      case 'COMPLETED': return 100
      default: return 0
    }
  }

  const assignedTasks = tasks.filter(task => 
    task.assignment === 'ALL_EMPLOYEES' || task.assigneeId === session?.user?.id
  )

  const completedTasks = assignedTasks.filter(task => task.status === 'COMPLETED')
  const activeTasks = assignedTasks.filter(task => task.status !== 'COMPLETED')

  if (status === 'loading') {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1">
            <li><a href="/employee" className="hover:underline">Dashboard</a></li>
            <li>/</li>
            <li className="text-gray-700 dark:text-gray-200">Tugas</li>
          </ol>
        </nav>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Tugas Saya</h1>
            <p className="text-text-secondary">
              Kelola dan kerjakan tugas yang diberikan | Total: {pagination.total} tugas | Halaman: {pagination.page}/{pagination.pages}
            </p>
          </div>
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Total Tugas</p>
                  <p className="text-2xl font-bold text-text-primary">{assignedTasks.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Aktif</p>
                  <p className="text-2xl font-bold text-text-primary">{activeTasks.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-success/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Selesai</p>
                  <p className="text-2xl font-bold text-text-primary">{completedTasks.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assigned'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              Tugas Aktif ({activeTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              Tugas Selesai ({completedTasks.length})
            </button>
          </nav>
        </div>

        {/* Tasks List */}
        <div className="bg-card rounded-lg shadow-soft">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tugas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioritas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(activeTab === 'assigned' ? activeTasks : completedTasks).map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {task.description}
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            {task.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {task.dueDate ? (
                          <div className="flex items-center gap-2">
                            <span>{formatDate(task.dueDate)}</span>
                            {(() => { const d = daysRemaining(task.dueDate); return d !== null ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${d < 0 ? 'bg-red-100 text-red-700' : d <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {d < 0 ? `Terlambat ${Math.abs(d)}h` : `${d}h lagi`}
                              </span>
                            ) : null })()}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button onClick={() => { setSelectedTask(task); setSubmitDesc(''); setSubmitFiles([]) }} variant="outline" size="sm" className="text-blue-600 hover:text-blue-700"><Eye className="w-4 h-4 mr-1" />Detail</Button>
                          {task.status === 'NOT_STARTED' && (
                            <Button
                              onClick={() => handleStartTask(task.id)}
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              Mulai
                            </Button>
                          )}
                          
                          {(task.status === 'IN_PROGRESS' || task.status === 'REVISION') && (
                            <Button
                              onClick={() => { setSelectedTask(task) }}
                              variant="outline"
                              size="sm"
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Submit
                            </Button>
                          )}
                          <Button
                            onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                            variant={task.status === 'COMPLETED' ? 'default' : 'outline'}
                            size="sm"
                            disabled={task.status === 'COMPLETED'}
                            className={`${task.status === 'COMPLETED' ? 'text-white' : 'text-green-600 hover:text-green-700'}`}
                          >
                            {task.status === 'COMPLETED' ? 'Tugas Selesai' : 'Tandai Selesai'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inline detail & submission */}
        {selectedTask && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getStatusText(selectedTask.status)}
                  </span>
                  {selectedTask.dueDate && (
                    <div className="flex items-center gap-2">
                      <span>Deadline: {formatDate(selectedTask.dueDate)}</span>
                      {(() => { const d = daysRemaining(selectedTask.dueDate); return d !== null ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${d < 0 ? 'bg-red-100 text-red-700' : d <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {d < 0 ? `Terlambat ${Math.abs(d)}h` : `${d}h lagi`}
                        </span>
                      ) : null })()}
                    </div>
                  )}
                </div>
                {selectedTask.status === 'REVISION' && selectedTask.validationMessage && (
                  <div className="mt-3 p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                    <strong>Catatan Revisi:</strong> {selectedTask.validationMessage}
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTask(null)}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Tutup
              </Button>
            </div>
            {/* Progress */}
            <div className="mt-3">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${statusProgress(selectedTask.status)}%` }} />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Progress {statusProgress(selectedTask.status)}%</div>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Deskripsi</h3>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              {/* Lampiran dari Admin (terintegrasi Dokumen) */}
              <div className="border rounded p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Lampiran Tugas</h3>
                {(() => {
                  const all = selectedTask.attachments || []
                  const filtered = all.filter(a => a.title.toLowerCase().includes(attSearch.toLowerCase()))
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <input value={attSearch} onChange={(e) => setAttSearch(e.target.value)} placeholder="Cari lampiran..." className="px-3 py-2 border rounded text-sm w-full md:w-64" />
                      </div>
                      {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filtered.map(att => (
                            <div key={att.id} className="border rounded p-3 bg-white dark:bg-gray-900">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={att.title}>{att.title}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{att.mimeType} • {Math.round(att.size/1024)} KB</div>
                              {att.url && (
                                att.mimeType.startsWith('image/') ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={att.url} alt={att.title} className="mt-2 max-h-40 w-full object-contain rounded" />
                                ) : att.mimeType === 'application/pdf' ? (
                                  <object data={att.url} type="application/pdf" className="mt-2 w-full h-40 rounded" />
                                ) : null
                              )}
                              <div className="mt-2">
                                {att.url ? (
                                  <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-xs underline">Unduh</a>
                                ) : (
                                  <span className="text-xs text-gray-500">URL tidak tersedia</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Tidak ada lampiran tugas.</p>
                      )}
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-600 dark:text-gray-400">
                        <div>Total {filtered.length} file</div>
                      </div>
                    </>
                  )
                })()}
              </div>

              {(selectedTask.status !== 'COMPLETED') && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-blue-600" />
                    Submit Tugas
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi Submission</label>
                      <textarea 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        rows={4} 
                        value={submitDesc} 
                        onChange={(e) => setSubmitDesc(e.target.value)}
                        placeholder="Jelaskan apa yang telah Anda kerjakan..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Submission (Maksimal 10 file)</label>
                      <TaskFileUpload
                        files={submitFiles}
                        onFilesChange={setSubmitFiles}
                        maxFiles={10}
                        maxFileSize={10}
                        maxTotalSize={50}
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <Button 
                        onClick={handleSubmitTask} 
                        disabled={submitting} 
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Kirim Tugas
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setSubmitDesc(''); setSubmitFiles([]) }}
                        className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions: Selesai / Revisi */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  onClick={() => handleUpdateStatus(selectedTask.id, 'COMPLETED')}
                  disabled={selectedTask.status === 'COMPLETED'}
                  className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium ${
                    selectedTask.status === 'COMPLETED' 
                      ? 'bg-green-600 text-white cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedTask.status === 'COMPLETED' ? 'Tugas Selesai' : 'Tandai Selesai'}
                </Button>
                {selectedTask.status === 'COMPLETED' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedTask.id, 'REVISION')}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Minta Revisi
                  </Button>
                )}
              </div>

              {/* Uploaded Files */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  File yang Sudah Diupload
                </h3>
                <div className="space-y-4">
                  {Array.isArray(selectedTask.submissions) && selectedTask.submissions.length > 0 ? (
                    selectedTask.submissions.map((s) => (
                      <div key={s.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Dikirim: {new Date(s.submittedAt).toLocaleString('id-ID')}
                        </div>
                        {s.files && s.files.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {s.files.map((f) => (
                              <div key={f.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2" title={f.fileName}>
                                  {f.fileName}
                                </div>
                                {f.fileType?.startsWith('image/') ? (
                                  <img src={f.fileUrl} alt={f.fileName} className="mt-2 max-h-32 sm:max-h-40 object-contain w-full rounded" />
                                ) : f.fileType === 'application/pdf' ? (
                                  <embed src={f.fileUrl} className="mt-2 w-full h-32 sm:h-40 rounded" type="application/pdf" />
                                ) : f.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.fileType === 'application/msword' ? (
                                  <div className="mt-2 w-full h-32 sm:h-40 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                                    <div className="text-center">
                                      <div className="text-2xl mb-2">📄</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">DOCX Preview</div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">Gunakan tombol Unduh untuk membuka</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 w-full h-32 sm:h-40 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                                    <div className="text-center">
                                      <div className="text-2xl mb-2">📁</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">File Preview</div>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-3">
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
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Tidak ada file yang diupload.
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">Belum ada submission atau file.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}

