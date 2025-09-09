'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Eye,
  Calendar,
  Tag
} from 'lucide-react'
// Inline submission UI; legacy modal removed

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

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
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
      alert(`Gagal submit: ${e instanceof Error ? e.message : 'Unknown error'}`)
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Tugas Saya</h1>
            <p className="text-text-secondary">Kelola dan kerjakan tugas yang diberikan</p>
          </div>
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
                        {task.dueDate ? formatDate(task.dueDate) : '-'}
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
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getStatusText(selectedTask.status)}</p>
                {selectedTask.status === 'REVISION' && selectedTask.validationMessage && (
                  <p className="mt-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">Catatan Revisi: {selectedTask.validationMessage}</p>
                )}
              </div>
              <Button variant="outline" onClick={() => setSelectedTask(null)}>Tutup</Button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Deskripsi</h3>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              {(selectedTask.status === 'IN_PROGRESS' || selectedTask.status === 'REVISION') && (
                <div className="border rounded p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Submit Tugas</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Deskripsi</label>
                      <textarea className="w-full border rounded px-3 py-2" rows={3} value={submitDesc} onChange={(e) => setSubmitDesc(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">File (bisa multi)</label>
                      <input type="file" multiple onChange={(e) => setSubmitFiles(Array.from(e.target.files || []))} />
                      {submitFiles.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">{submitFiles.length} file dipilih</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitTask} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Mengirim...' : 'Kirim'}</Button>
                      <Button variant="outline" onClick={() => { setSubmitDesc(''); setSubmitFiles([]) }}>Reset</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              <div className="border rounded p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">File yang sudah diupload</h3>
                <div className="space-y-3">
                  {Array.isArray(selectedTask.submissions) && selectedTask.submissions.length > 0 ? (
                    selectedTask.submissions.map((s) => (
                      <div key={s.id} className="border rounded p-3">
                        <div className="text-xs text-gray-500 mb-2">Dikirim: {new Date(s.submittedAt).toLocaleString('id-ID')}</div>
                        {s.files && s.files.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {s.files.map((f) => (
                              <div key={f.id} className="border rounded p-2">
                                <div className="text-xs text-gray-700 truncate" title={f.fileName}>{f.fileName}</div>
                                {f.fileType?.startsWith('image/') ? (
                                  <img src={f.fileUrl} alt={f.fileName} className="mt-2 max-h-40 object-contain w-full" />
                                ) : f.fileType === 'application/pdf' ? (
                                  <embed src={f.fileUrl} className="mt-2 w-full h-40" type="application/pdf" />
                                ) : f.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.fileType === 'application/msword' ? (
                                  <div className="mt-2 w-full h-40 border border-border rounded flex items-center justify-center bg-surface">
                                    <div className="text-center">
                                      <div className="text-2xl mb-2">📄</div>
                                      <div className="text-xs text-text-secondary">DOCX Preview</div>
                                      <div className="text-xs text-text-muted">Gunakan tombol Unduh untuk membuka</div>
                                    </div>
                                  </div>
                                ) : null}
                                <div className="mt-2">
                                  <a href={f.fileUrl} target="_blank" rel="noreferrer" download className="text-blue-600 text-xs underline">Unduh</a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Tidak ada file.</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Belum ada submission atau file.</div>
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

