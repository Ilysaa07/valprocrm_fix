'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Search, Eye, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

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
  const [filters, setFilters] = useState({ status: '', priority: '', assignee: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [createForm, setCreateForm] = useState({
    title: '', description: '', dueDate: '', priority: 'MEDIUM' as Task['priority'], assignment: 'ALL_EMPLOYEES' as Task['assignment'], assigneeId: ''
  })
  const [createFiles, setCreateFiles] = useState<File[]>([])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    fetchTasks(); fetchUsers()
  }, [session, status])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } finally { setLoading(false) }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          dueDate: createForm.dueDate || undefined,
          priority: createForm.priority,
          assignment: createForm.assignment,
          assigneeId: createForm.assignment === 'SPECIFIC' ? createForm.assigneeId : undefined,
          tags: []
        })
      })
      if (!res.ok) throw new Error('failed')
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
      fetchTasks()
    } catch {}
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Hapus tugas ini?')) return
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    fetchTasks()
  }

  const handleSubmissionValidation = async (submissionId: string, action: 'approve' | 'reject' | 'revise', feedback?: string) => {
    await fetch(`/api/task-submissions/${submissionId}/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, feedback }) })
    fetchTasks()
  }

  const getPriorityColor = (p: Task['priority']) => p === 'LOW' ? 'bg-success/20 text-success-dark border-success/30' : p === 'MEDIUM' ? 'bg-warning/20 text-warning-dark border-warning/30' : p === 'HIGH' ? 'bg-warning/30 text-warning-dark border-warning/40' : 'bg-error/20 text-error-dark border-error/30'
  const getStatusColor = (s: Task['status']) => s === 'NOT_STARTED' ? 'bg-surface text-text-secondary border-border' : s === 'IN_PROGRESS' ? 'bg-info-light text-info-dark border-info' : s === 'PENDING_VALIDATION' ? 'bg-warning-light text-warning-dark border-warning' : s === 'REVISION' ? 'bg-warning-light text-warning-dark border-warning' : 'bg-success-light text-success-dark border-success'
  const getStatusText = (s: Task['status']) => s === 'NOT_STARTED' ? 'Belum Dimulai' : s === 'IN_PROGRESS' ? 'Sedang Dikerjakan' : s === 'PENDING_VALIDATION' ? 'Menunggu Validasi' : s === 'REVISION' ? 'Revisi' : 'Selesai'

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
      <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      </AdminLayout>
    )

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Manajemen Tugas</h1>
            <p className="text-text-secondary">Kelola dan validasi tugas karyawan</p>
          </div>
          <Button onClick={() => setShowCreate(v => !v)} className="bg-accent hover:bg-accent-hover">
            <Plus className="w-4 h-4 mr-2" />{showCreate ? 'Tutup' : 'Buat Tugas Baru'}
          </Button>
        </div>

        {showCreate && (
          <div className="bg-card rounded-lg shadow-soft p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm text-text-secondary mb-1">Judul</label><input className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary" value={createForm.title} onChange={(e) => setCreateForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><label className="block text-sm text-text-secondary mb-1">Deadline</label><input type="date" className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary" value={createForm.dueDate} onChange={(e) => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="block text-sm text-text-secondary mb-1">Deskripsi</label><textarea className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary" rows={3} value={createForm.description} onChange={(e) => setCreateForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="md:col-span-2">
                <label className="block text-sm text-text-secondary mb-1">Lampiran (opsional)</label>
                <input type="file" multiple onChange={(e) => setCreateFiles(Array.from(e.target.files || []))} className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary" />
                {createFiles.length > 0 && (
                  <div className="mt-2 text-xs text-text-secondary">{createFiles.length} file dipilih</div>
                )}
              </div>
              <div><label className="block text-sm text-text-secondary mb-1">Prioritas</label><select className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary" value={createForm.priority} onChange={(e) => setCreateForm(p => ({ ...p, priority: e.target.value as any }))}><option value="LOW">Rendah</option><option value="MEDIUM">Sedang</option><option value="HIGH">Tinggi</option><option value="URGENT">Urgent</option></select></div>
              <div><label className="block text-sm text-text-secondary mb-1">Penugasan</label><select className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary" value={createForm.assignment} onChange={(e) => setCreateForm(p => ({ ...p, assignment: e.target.value as any }))}><option value="ALL_EMPLOYEES">Semua Karyawan</option><option value="SPECIFIC">User Tertentu</option></select></div>
              {createForm.assignment === 'SPECIFIC' && (
                <div><label className="block text-sm text-text-secondary mb-1">Pilih Karyawan</label><select className="w-full border border-border rounded px-3 py-2 bg-card text-text-primary" value={createForm.assigneeId} onChange={(e) => setCreateForm(p => ({ ...p, assigneeId: e.target.value }))}><option value="">-- pilih --</option>{users.map(u => (<option key={u.id} value={u.id}>{u.fullName}</option>))}</select></div>
              )}
                </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCreateTask} className="bg-accent hover:bg-accent-hover"><Plus className="w-4 h-4 mr-2" />Kirim Tugas</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
                </div>
              </div>
        )}

        <div className="bg-card rounded-lg shadow-soft p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input type="text" placeholder="Cari tugas..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-card text-text-primary" />
              </div>
            </div>
            <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="">Semua Status</option><option value="NOT_STARTED">Belum Dimulai</option><option value="IN_PROGRESS">Sedang Dikerjakan</option><option value="PENDING_VALIDATION">Menunggu Validasi</option><option value="REVISION">Revisi</option><option value="COMPLETED">Selesai</option></select>
            <select value={filters.priority} onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="">Semua Prioritas</option><option value="LOW">Rendah</option><option value="MEDIUM">Sedang</option><option value="HIGH">Tinggi</option><option value="URGENT">Urgent</option></select>
            <select value={filters.assignee} onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="">Semua Karyawan</option>{users.map(u => (<option key={u.id} value={u.id}>{u.fullName}</option>))}</select>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-soft">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tugas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Karyawan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Prioritas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-card-hover">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{task.title}</div>
                          <div className="text-sm text-text-secondary line-clamp-2">{task.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">{task.assignee?.fullName || 'Semua Karyawan'}</div>
                        <div className="text-sm text-text-secondary">{task.assignee?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>{getStatusText(task.status)}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>{task.priority}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button onClick={() => setSelectedTask(task)} variant="outline" size="sm" className="text-accent hover:text-accent-hover"><Eye className="w-4 h-4 mr-1" />Detail</Button>
                          <Button onClick={() => handleDeleteTask(task.id)} variant="outline" size="sm" className="text-error hover:text-error-hover">Hapus</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedTask && (
          <div className="mt-6 bg-card rounded-lg shadow-soft p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Detail Tugas</h2>
                <p className="text-sm text-text-secondary">{selectedTask.title}</p>
              </div>
              <Button variant="outline" onClick={() => setSelectedTask(null)}>Tutup</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-text-secondary">Deskripsi</h3>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-secondary">Submission Karyawan</h3>
                  <div className="space-y-3">
                    {(selectedTask.submissions || []).map((s) => (
                      <div key={s.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-text-secondary">Dikirim: {new Date(s.submittedAt).toLocaleString('id-ID')}</div>
                          {selectedTask.status !== 'COMPLETED' ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSubmissionValidation(s.id, 'approve')} className="bg-success hover:bg-success-dark"><CheckCircle className="w-4 h-4 mr-1" />Setujui</Button>
                              <Button size="sm" variant="outline" onClick={() => { const fb = prompt('Masukkan catatan revisi (opsional)') || undefined; handleSubmissionValidation(s.id, 'revise', fb) }}>Minta Revisi</Button>
                              <Button size="sm" variant="outline" onClick={() => handleSubmissionValidation(s.id, 'reject')}>Tolak</Button>
                            </div>
                          ) : (
                            <div className="text-xs text-text-secondary">Tugas sudah selesai</div>
                          )}
                        </div>
                        {s.files && s.files.length > 0 && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {s.files.map((f) => (
                              <div key={f.id} className="border rounded p-2">
                                <div className="text-xs text-text-secondary truncate" title={f.fileName}>{f.fileName}</div>
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
                                  <a href={f.fileUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center text-accent text-xs underline">Unduh</a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(selectedTask.submissions || []).length === 0 && (<p className="text-sm text-text-muted">Belum ada submission.</p>)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-text-secondary">Status</h3>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {(['NOT_STARTED','IN_PROGRESS','PENDING_VALIDATION','REVISION','COMPLETED'] as Task['status'][]).map(st => (
                      <Button key={st} size="sm" variant={selectedTask.status === st ? 'default' : 'outline'} onClick={async () => {
                        await fetch(`/api/tasks/${selectedTask.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: st }) })
                        fetchTasks()
                      }}>{getStatusText(st)}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-secondary">Lampiran Tugas</h3>
                  <div className="mt-2">
                    {(selectedTask.attachments && selectedTask.attachments.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedTask.attachments.map(att => (
                          <div key={att.id} className="border rounded p-3 bg-surface">
                            <div className="text-sm font-medium text-text-primary truncate" title={att.title}>{att.title}</div>
                            <div className="text-xs text-text-secondary mt-1">{att.mimeType} • {Math.round(att.size/1024)} KB</div>
                            <div className="mt-2">
                              {att.url ? (
                                <a href={att.url} target="_blank" rel="noreferrer" className="text-accent text-xs underline">Unduh</a>
                              ) : (
                                <span className="text-text-muted text-xs">URL tidak tersedia</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">Belum ada lampiran.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


