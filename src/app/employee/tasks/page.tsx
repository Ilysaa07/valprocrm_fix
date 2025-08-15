'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { 
  Search, 
  Filter, 
  Calendar,
  User,
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  Eye,
  Upload,
  FileText,
  Send
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
  submissions: any[]
}

function EmployeeTasksPageInner() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const [submitData, setSubmitData] = useState({
    description: '',
    documentUrl: '',
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    name: string
    size: number
    type: string
  } | null>(null)

  useEffect(() => {
    fetchTasks()
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

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
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

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTask) return

    try {
      // Use uploaded file URL if available, otherwise use manual URL
      const documentUrl = uploadedFile?.url || submitData.documentUrl
      const documentName = uploadedFile?.name
      const documentSize = uploadedFile?.size

      const response = await fetch(`/api/tasks/${selectedTask.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: submitData.description,
          documentUrl,
          documentName,
          documentSize
        }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchTasks()
        setShowSubmitModal(false)
        setSelectedTask(null)
        setSubmitData({ description: '', documentUrl: '' })
        setUploadedFile(null)
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/tasks/upload-document', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadedFile(data.file)
        // Clear manual URL if file is uploaded
        setSubmitData({ ...submitData, documentUrl: '' })
      } else {
        alert(data.error || 'Gagal mengupload file')
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengupload file')
    } finally {
      setUploadingFile(false)
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
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

  const hasSubmission = (task: Task) => {
    return task.submissions && task.submissions.length > 0
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tugas Saya</h1>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada tugas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tidak ada tugas yang sesuai dengan pencarian.' : 'Belum ada tugas yang diberikan.'}
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
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
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
                          : 'Tugas Khusus'
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
                    <span className="text-xs text-gray-500">Pemberi Tugas</span>
                    <span className="text-xs text-gray-700">{task.createdBy.fullName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status Pengumpulan</span>
                    <span className={`text-xs font-medium ${hasSubmission(task) ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasSubmission(task) ? 'Sudah Dikumpulkan' : 'Belum Dikumpulkan'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  {task.status === 'NOT_STARTED' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                      className="w-full bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 text-sm"
                    >
                      Mulai Mengerjakan
                    </button>
                  )}
                  
                  {task.status === 'IN_PROGRESS' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task)
                          setShowSubmitModal(true)
                        }}
                        className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm flex items-center justify-center space-x-1"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{hasSubmission(task) ? 'Update Pengumpulan' : 'Kumpulkan Tugas'}</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'NOT_STARTED')}
                        className="w-full bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                      >
                        Batalkan
                      </button>
                    </div>
                  )}
                  
                  {task.status === 'PENDING_VALIDATION' && (
                    <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-blue-800 font-medium">Tugas sedang menunggu validasi dari admin</p>
                    </div>
                  )}
                  
                  {task.status === 'COMPLETED' && hasSubmission(task) && (
                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setShowSubmitModal(true)
                      }}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm flex items-center justify-center space-x-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Update Pengumpulan</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && !showSubmitModal && (
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Pemberi Tugas:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedTask.createdBy.fullName}</p>
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
                
                {hasSubmission(selectedTask) && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Pengumpulan Saya</h5>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {selectedTask.submissions[0].description && (
                        <p className="text-sm text-gray-600 mb-2">{selectedTask.submissions[0].description}</p>
                      )}
                      {selectedTask.submissions[0].documentUrl && (
                        <a 
                          href={selectedTask.submissions[0].documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 inline-block"
                        >
                          Lihat Dokumen
                        </a>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Dikumpulkan: {new Date(selectedTask.submissions[0].submittedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Task Modal */}
      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {hasSubmission(selectedTask) ? 'Update Pengumpulan Tugas' : 'Kumpulkan Tugas'}
                </h3>
                <button
                  onClick={() => {
                    setShowSubmitModal(false)
                    setSubmitData({ description: '', documentUrl: '' })
                    setUploadedFile(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">{selectedTask.title}</h4>
                <p className="text-sm text-blue-700 mt-1">{selectedTask.description}</p>
              </div>
              
              <form onSubmit={handleSubmitTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Pengumpulan (Opsional)
                  </label>
                  <textarea
                    value={submitData.description}
                    onChange={(e) => setSubmitData({...submitData, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Jelaskan hasil pekerjaan Anda atau catatan tambahan..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Dokumen
                  </label>
                  
                  {!uploadedFile ? (
                    <div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.gif"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, JPEG, PNG, WEBP, GIF. Maksimal 10MB.
                      </p>
                      {uploadingFile && (
                        <p className="text-sm text-green-600 mt-2">Mengupload file...</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                            <p className="text-xs text-green-600">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeUploadedFile}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center text-gray-500 text-sm">atau</div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Dokumen (Alternatif)
                  </label>
                  <input
                    type="url"
                    value={submitData.documentUrl}
                    onChange={(e) => setSubmitData({...submitData, documentUrl: e.target.value})}
                    disabled={!!uploadedFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="https://drive.google.com/... atau link dokumen lainnya"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan link Google Drive, Dropbox, atau platform penyimpanan lainnya
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center space-x-1"
                  >
                    <Send className="h-4 w-4" />
                    <span>{hasSubmission(selectedTask) ? 'Update Pengumpulan' : 'Kumpulkan Tugas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmitModal(false)
                      setSubmitData({ description: '', documentUrl: '' })
                      setUploadedFile(null)
                    }}
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
    </EmployeeLayout>
  )
}

export default function EmployeeTasksPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EmployeeTasksPageInner />
    </Suspense>
  )
}

