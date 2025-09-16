'use client'

import { useState, useEffect, useCallback } from 'react'
import { showSuccess, showError, showConfirm } from '@/lib/swal';
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  Database, 
  Download, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Archive,
  Settings,
  Play,
  Pause,
  Server,
  Monitor,
  MemoryStick,
  HardDriveIcon,
  Plus,
  Edit,
  Trash2,
  Timer,
  Activity
} from 'lucide-react'

interface BackupFile {
  filename: string
  size: number
  created: string
  modified: string
  type: 'database' | 'files' | 'full'
  format: 'sql' | 'json' | 'unknown'
}

interface BackupStatus {
  hasBackups: boolean
  lastBackup: {
    filename: string
    created: string
    size: number
  } | null
  backupDirectory: string
  systemInfo: {
    hostname: string
    platform: string
    arch: string
    totalMemory: number
    freeMemory: number
  }
}

interface BackupResult {
  success: boolean
  message: string
  filename?: string
  size?: number
  timestamp: string
  type: string
}

interface BackupSchedule {
  id: string
  name: string
  type: 'database' | 'files' | 'full'
  format: 'sql' | 'json'
  cron: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  lastStatus?: 'SUCCESS' | 'FAILED' | 'RUNNING'
  retentionDays: number
}

interface BackupJob {
  id: string
  scheduleId: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  startedAt?: string
  completedAt?: string
  filename?: string
  size?: number
  error?: string
}

export default function AdminBackupPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [schedules, setSchedules] = useState<BackupSchedule[]>([])
  const [jobs, setJobs] = useState<BackupJob[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'schedules' | 'settings'>('overview')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null)
  const [quickSchedule, setQuickSchedule] = useState({
    cron: '0 2 * * *',
    enabled: false
  })

  const loadBackupData = useCallback(async () => {
    setLoading(true)
    try {
      const [filesRes, statusRes] = await Promise.all([
        fetch('/api/admin/system/backup'),
        fetch('/api/admin/system/backup?format=sql')
      ])
      
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setBackupFiles(filesData.data || [])
      }
      
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setBackupStatus(statusData)
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        setSchedules(schedulesData.data || [])
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData.data || [])
      }
    } catch {
      showToast('Gagal memuat data backup', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    
    loadBackupData()
  }, [session, status, loadBackupData])

  const createBackup = async (type: 'database' | 'files' | 'full', format: 'sql' | 'json' = 'sql') => {
    setCreating(true)
    try {
      // Trigger download directly using new endpoint
      const res = await fetch(`/api/admin/system/backup${format === 'sql' ? '?format=sql' : ''}`)
      if (!res.ok) throw new Error('Gagal membuat backup')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().split('T')[0]}.${format === 'sql' ? 'sql' : 'zip'}`
      a.click()
      window.URL.revokeObjectURL(url)
      showToast('Backup berhasil diunduh', { title: 'Sukses', type: 'success' })
    } catch {
      showToast('Terjadi kesalahan saat membuat backup', { title: 'Error', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const res = await fetch(`/api/admin/system/backup`)
      
      if (!res.ok) {
        throw new Error('Gagal mengunduh backup')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
      
      showToast('Backup berhasil diunduh', { title: 'Sukses', type: 'success' })
    } catch {
      showToast('Gagal mengunduh backup', { title: 'Error', type: 'error' })
    }
  }

  const createSchedule = async (scheduleData: Partial<BackupSchedule>) => {
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-schedule', ...scheduleData })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        showToast(result.message, { title: 'Sukses', type: 'success' })
        setShowScheduleModal(false)
        setEditingSchedule(null)
        await loadBackupData()
      } else {
        showToast(result.error || 'Gagal membuat jadwal', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat membuat jadwal', { title: 'Error', type: 'error' })
    }
  }

  const toggleSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-schedule', id })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        showToast(result.message, { title: 'Sukses', type: 'success' })
        await loadBackupData()
      } else {
        showToast(result.error || 'Gagal mengubah status jadwal', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat mengubah status jadwal', { title: 'Error', type: 'error' })
    }
  }

  const deleteSchedule = async (id: string) => {
    const result = await showConfirm("Konfirmasi", 'Apakah Anda yakin ingin menghapus jadwal ini?', "Ya", "Batal");
    if (!result.isConfirmed) return
    
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-schedule', id })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        showToast(result.message, { title: 'Sukses', type: 'success' })
        await loadBackupData()
      } else {
        showToast(result.error || 'Gagal menghapus jadwal', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat menghapus jadwal', { title: 'Error', type: 'error' })
    }
  }

  const runSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-schedule', id })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        showToast(result.message, { title: 'Sukses', type: 'success' })
        await loadBackupData()
      } else {
        showToast(result.error || 'Gagal menjalankan jadwal', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat menjalankan jadwal', { title: 'Error', type: 'error' })
    }
  }

  const saveQuickSchedule = async () => {
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create-schedule',
          name: 'Quick Backup Schedule',
          type: 'full' as const,
          format: 'sql' as const,
          cron: quickSchedule.cron,
          enabled: quickSchedule.enabled,
          retentionDays: 30
        })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        showToast('Jadwal backup berhasil disimpan', { title: 'Sukses', type: 'success' })
        await loadBackupData()
      } else {
        showToast(result.error || 'Gagal menyimpan jadwal', { title: 'Error', type: 'error' })
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan jadwal', { title: 'Error', type: 'error' })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="w-4 h-4" />
      case 'files': return <HardDrive className="w-4 h-4" />
      case 'full': return <Archive className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'database': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'files': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'full': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#121212] min-h-screen transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Backup & Restore
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola backup database dan file sistem</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadBackupData} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Archive className="w-4 h-4" />
              Backup Files
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Timer className="w-4 h-4" />
              Schedules
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Status */}
            {backupStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Server</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{backupStatus.systemInfo.hostname}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <MemoryStick className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Memory</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatBytes(backupStatus.systemInfo.freeMemory)} / {formatBytes(backupStatus.systemInfo.totalMemory)}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <HardDriveIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Platform</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{backupStatus.systemInfo.platform}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Backup</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {backupStatus.lastBackup ? formatDate(backupStatus.lastBackup.created) : 'Never'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Automatic Backup Section */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Left Column - Information */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Backup Otomatis</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Jalankan backup manual atau atur jadwal otomatis
                    </p>
                  </div>
                  
                  {backupStatus?.lastBackup && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Terakhir:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(backupStatus.lastBackup.created)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <Badge variant="success" className="text-xs">
                          SUCCESS
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Actions and Configuration */}
                <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[400px]">
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => createBackup('full', 'sql')}
                      disabled={creating}
                      className="flex items-center gap-2 flex-1 sm:flex-none"
                    >
                      {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      Jalankan Sekarang
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => createBackup('files')}
                      disabled={creating}
                      className="flex items-center gap-2 flex-1 sm:flex-none"
                    >
                      {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                      Simpan ke Lokal
                    </Button>
                  </div>

                  {/* Schedule Configuration */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">Jadwal Otomatis</h4>
                      <Button
                        onClick={() => setShowScheduleModal(true)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        Atur Jadwal
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Jadwal (cron):
                        </label>
                        <input
                          type="text"
                          value={quickSchedule.cron}
                          onChange={(e) => setQuickSchedule(prev => ({ ...prev, cron: e.target.value }))}
                          className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm"
                          placeholder="0 2 * * *"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="backup-active"
                            checked={quickSchedule.enabled}
                            onChange={(e) => setQuickSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="backup-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Aktif
                          </label>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={saveQuickSchedule}
                          className="flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          Simpan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Backup Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Database Backup</h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => createBackup('database', 'sql')}
                      disabled={creating}
                      className="flex items-center gap-2"
                    >
                      {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      SQL Format
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => createBackup('database', 'json')}
                      disabled={creating}
                      className="flex items-center gap-2"
                    >
                      {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      JSON Format
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Files Backup</h4>
                  <Button
                    onClick={() => createBackup('files')}
                    disabled={creating}
                    className="flex items-center gap-2"
                  >
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                    Backup Files
                  </Button>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Full Backup</h4>
                  <Button
                    onClick={() => createBackup('full', 'sql')}
                    disabled={creating}
                    className="flex items-center gap-2"
                  >
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                    Full Backup
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Backup Files</h3>
                <Badge variant="secondary">
                  {backupFiles.length} files
                </Badge>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : backupFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No backup files found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Create your first backup using the Quick Actions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backupFiles.map((file) => (
                    <div key={file.filename} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                          {getTypeIcon(file.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{file.filename}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.created)}</span>
                            <Badge className={`text-xs ${getTypeColor(file.type)}`}>
                              {file.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {file.format}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(file.filename)}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Backup Schedules</h3>
                <Button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Schedule
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No backup schedules found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Create your first schedule to automate backups</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                          {getTypeIcon(schedule.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">{schedule.name}</p>
                            <Badge className={`text-xs ${getTypeColor(schedule.type)}`}>
                              {schedule.type}
                            </Badge>
                            <Badge variant={schedule.enabled ? 'success' : 'secondary'} className="text-xs">
                              {schedule.enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.cron}
                            </span>
                            <span>•</span>
                            <span>Next: {schedule.nextRun ? formatDate(schedule.nextRun) : 'Not scheduled'}</span>
                            {schedule.lastRun && (
                              <>
                                <span>•</span>
                                <span>Last: {formatDate(schedule.lastRun)}</span>
                              </>
                            )}
                          </div>
                          {schedule.lastStatus && (
                            <div className="flex items-center gap-1 mt-1">
                              {schedule.lastStatus === 'SUCCESS' && <CheckCircle className="w-3 h-3 text-green-500" />}
                              {schedule.lastStatus === 'FAILED' && <XCircle className="w-3 h-3 text-red-500" />}
                              {schedule.lastStatus === 'RUNNING' && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {schedule.lastStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runSchedule(schedule.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Run Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSchedule(schedule.id)}
                          className="flex items-center gap-1"
                        >
                          {schedule.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {schedule.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSchedule(schedule)
                            setShowScheduleModal(true)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteSchedule(schedule.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Jobs */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Jobs</h3>
              {jobs.length === 0 ? (
                <div className="text-center py-4">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No recent jobs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-gray-200 dark:bg-gray-600 rounded">
                          {job.status === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {job.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-500" />}
                          {job.status === 'RUNNING' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                          {job.status === 'PENDING' && <Clock className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {schedules.find(s => s.id === job.scheduleId)?.name || 'Unknown Schedule'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.startedAt ? formatDate(job.startedAt) : 'Not started'}
                            {job.filename && ` • ${job.filename}`}
                            {job.size && ` • ${formatBytes(job.size)}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={job.status === 'SUCCESS' ? 'success' : job.status === 'FAILED' ? 'danger' : 'secondary'} className="text-xs">
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Backup Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Backup Directory</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {backupStatus?.backupDirectory || 'Not configured'}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        Ensure this directory has sufficient disk space and proper permissions for backup operations.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Default Backup Format
                    </label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2">
                      <option value="sql">SQL (Recommended)</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Compression Level
                    </label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2">
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Save Settings
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reset to Default
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingSchedule ? 'Edit Schedule' : 'New Backup Schedule'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const scheduleData: Partial<BackupSchedule> = {
                  name: formData.get('name') as string,
                  type: formData.get('type') as 'database' | 'files' | 'full',
                  format: formData.get('format') as 'sql' | 'json',
                  cron: formData.get('cron') as string,
                  retentionDays: parseInt(formData.get('retentionDays') as string) || 30
                }
                createSchedule(scheduleData)
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingSchedule?.name || ''}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                    placeholder="e.g., Daily Database Backup"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Backup Type
                  </label>
                  <select
                    name="type"
                    defaultValue={editingSchedule?.type || 'database'}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                  >
                    <option value="database">Database Only</option>
                    <option value="files">Files Only</option>
                    <option value="full">Full Backup</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    name="format"
                    defaultValue={editingSchedule?.format || 'sql'}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                  >
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cron Schedule
                  </label>
                  <input
                    type="text"
                    name="cron"
                    defaultValue={editingSchedule?.cron || '0 2 * * *'}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                    placeholder="0 2 * * * (daily at 2 AM)"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Format: minute hour day month weekday
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retention Days
                  </label>
                  <input
                    type="number"
                    name="retentionDays"
                    defaultValue={editingSchedule?.retentionDays || 30}
                    min="1"
                    max="365"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowScheduleModal(false)
                      setEditingSchedule(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
