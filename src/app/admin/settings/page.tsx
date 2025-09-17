'use client'

import { useState, useEffect } from 'react'
import { showConfirm } from '@/lib/swal';
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useUpdateSession } from '@/hooks/useUpdateSession'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  Settings, 
  Shield, 
  HelpCircle, 
  Mail,
  User, 
  Bell, 
  Key, 
  Eye, 
  Clock, 
  MapPin, 
  Monitor, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Users,
  Building,
  Globe,
  FileText,
  BarChart3,
  Cog,
  Zap,
  Moon,
  Sun
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'

interface SecurityLog {
  id: string
  userId: string
  userFullName: string
  userEmail: string
  action: string
  ipAddress: string
  userAgent: string
  location: string
  timestamp: string
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED'
  details: string
}

interface SystemStatus {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
  lastBackup: string
  activeUsers: number
  totalUsers: number
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    expiryDays: number
  }
  sessionTimeout: number
  maxLoginAttempts: number
  ipWhitelist: string[]
  auditLogging: boolean
  encryptionLevel: 'BASIC' | 'STANDARD' | 'HIGH'
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const router = useRouter()
  const { updateSession } = useUpdateSession()
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'help' | 'profile'>('general')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: 0,
    lastBackup: '',
    activeUsers: 0,
    totalUsers: 0
  })
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      expiryDays: 90
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: [],
    auditLogging: true,
    encryptionLevel: 'STANDARD'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'BLOCKED'>('ALL')
  const [showAddIpForm, setShowAddIpForm] = useState(false)
  const [newIpAddress, setNewIpAddress] = useState('')
  // Backup features removed per requirement

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    
    fetchSecurityLogs()
    fetchSystemStatus()
    fetchSecuritySettings()
  }, [session, status])

  const fetchSecurityLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/security/logs')
      if (response.ok) {
        const data = await response.json()
        setSecurityLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching security logs:', error)
      // Mock data for demo
      setSecurityLogs([
        {
          id: '1',
          userId: 'user1',
          userFullName: 'Admin User',
          userEmail: 'admin@company.com',
          action: 'LOGIN',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'Jakarta, Indonesia',
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          details: 'Successful login from office network'
        },
        {
          id: '2',
          userId: 'user2',
          userFullName: 'John Doe',
          userEmail: 'john@company.com',
          action: 'LOGIN',
          ipAddress: '203.123.45.67',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          location: 'Bandung, Indonesia',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'SUCCESS',
          details: 'Successful login from mobile device'
        },
        {
          id: '3',
          userId: 'user3',
          userFullName: 'Jane Smith',
          userEmail: 'jane@company.com',
          action: 'LOGIN',
          ipAddress: '45.67.89.123',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          location: 'Surabaya, Indonesia',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'FAILED',
          details: 'Invalid password attempt'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(s => ({ ...s, ...data }))
      }
    } catch (error) {
      // ignore; card will retain last values
    }
  }

  useEffect(() => {
    let es: EventSource | null = null
    let poll: ReturnType<typeof setInterval> | undefined
    try {
      es = new EventSource('/api/system/status?mode=sse')
      es.onmessage = (e) => { try { const d = JSON.parse(e.data as string); setSystemStatus(s => ({ ...s, ...d })) } catch {} }
      es.addEventListener('update', (e: any) => { try { const d = JSON.parse(e.data as string); setSystemStatus(s => ({ ...s, ...d })) } catch {} })
      es.onerror = () => { es?.close(); es = null; startPoll() }
    } catch {
      startPoll()
    }
    function startPoll() {
      const tick = () => { fetchSystemStatus() }
      tick()
      poll = setInterval(tick, 5000)
    }
    return () => { es?.close(); if (poll) clearInterval(poll) }
  }, [])

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/admin/security/settings')
      if (response.ok) {
        const data = await response.json()
        setSecuritySettings(data)
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
    }
  }

  // Backup API integrations removed

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setProfileMessage('')
    setProfileError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setProfileMessage('Foto profil berhasil diupload')
        
        // Update session untuk memperbarui foto profil di sidebar
        await updateSession({
          user: {
            image: data.profilePicture
          }
        })
        
        // Refresh halaman untuk memperbarui tampilan
        router.refresh()
      } else {
        setProfileError(data.error || 'Gagal mengupload foto profil')
      }
    } catch (error) {
      setProfileError('Terjadi kesalahan saat mengupload foto profil')
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    try {
      const response = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      
      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, ...newSettings }))
        showToast('Pengaturan keamanan berhasil diperbarui', { type: 'success' })
      } else {
        throw new Error('Failed to update security settings')
      }
    } catch (error) {
      showToast('Gagal memperbarui pengaturan keamanan', { type: 'error' })
    }
  }

  const addIpToWhitelist = () => {
    if (!newIpAddress.trim()) return
    
    const updatedWhitelist = [...securitySettings.ipWhitelist, newIpAddress.trim()]
    updateSecuritySettings({ ipWhitelist: updatedWhitelist })
    setNewIpAddress('')
    setShowAddIpForm(false)
  }

  const removeIpFromWhitelist = (ip: string) => {
    const updatedWhitelist = securitySettings.ipWhitelist.filter(ipAddr => ipAddr !== ip)
    updateSecuritySettings({ ipWhitelist: updatedWhitelist })
  }

  const exportSecurityLogs = () => {
    const csvContent = [
      ['ID', 'User', 'Email', 'Action', 'IP Address', 'Location', 'Status', 'Timestamp', 'Details'],
      ...securityLogs.map(log => [
        log.id,
        log.userFullName,
        log.userEmail,
        log.action,
        log.ipAddress,
        log.location,
        log.status,
        new Date(log.timestamp).toLocaleString('id-ID'),
        log.details
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showToast('Log keamanan berhasil diekspor', { type: 'success' })
  }

  const filteredLogs = securityLogs.filter(log => {
    const matchesSearch = 
      log.userFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />
      case 'BLOCKED': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'BLOCKED': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days} hari ${hours} jam`
    if (hours > 0) return `${hours} jam ${minutes} menit`
    return `${minutes} menit`
  }

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#121212] min-h-screen transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Pengaturan Sistem
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola pengaturan umum, keamanan, dan bantuan sistem</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'general', name: 'Pengaturan Umum', icon: Settings },
              { id: 'profile', name: 'Profil', icon: User },
              { id: 'security', name: 'Keamanan', icon: Shield },
              { id: 'help', name: 'Bantuan', icon: HelpCircle }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* System Status */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Status Sistem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">CPU Usage</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{systemStatus.cpu}%</p>
                    </div>
                    <Cpu className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Memory</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{systemStatus.memory}%</p>
                    </div>
                    <HardDrive className="w-8 h-8 text-green-600" />
                  </div>
              </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
              <div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Disk Space</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{systemStatus.disk}%</p>
                    </div>
                    <HardDrive className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Network</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{systemStatus.network}%</p>
                    </div>
                    <Globe className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatUptime(systemStatus.uptime)}</p>
              </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{systemStatus.activeUsers}</p>
            </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Backup</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(systemStatus.lastBackup).toLocaleDateString('id-ID')}
                  </p>
          </div>
              </div>
            </Card>

            {/* General Settings */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Cog className="w-5 h-5 text-blue-600" />
                Pengaturan Umum
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Mode Gelap</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Aktifkan tema gelap untuk tampilan</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const root = document.documentElement
                      const isDark = root.classList.contains('dark')
                      root.classList.toggle('dark', !isDark)
                      try { localStorage.setItem('theme', !isDark ? 'dark' : 'light') } catch {}
                      showToast(!isDark ? 'Mode gelap diaktifkan' : 'Mode terang diaktifkan', { type: 'success' })
                    }}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Toggle
                  </Button>
                </div>
                {/* Backup & Restore */}
                <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Backup & Restore</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Backup database (.sql → .zip) dan restore dari file .sql</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/admin/system/backup')
                            if (!res.ok) throw new Error('Gagal menyiapkan backup')
                            const blob = await res.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `backup-${new Date().toISOString().split('T')[0]}.zip`
                            a.click()
                            window.URL.revokeObjectURL(url)
                            showToast('Backup berhasil diunduh', { type: 'success' })
                          } catch (e) {
                            showToast('Gagal mengunduh backup', { type: 'error' })
                          }
                        }}
                      >
                        Unduh Backup
                      </Button>

                      <label className="inline-flex items-center gap-2">
                        <input
                          type="file"
                          accept=".sql"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const result = await showConfirm(
                              'Konfirmasi Restore',
                              'Semua data lama akan terganti. Lanjutkan restore?',
                              'Ya, Restore',
                              'Batal'
                            );
                            if (!result.isConfirmed) return
                            try {
                              const form = new FormData()
                              form.append('file', file)
                              const res = await fetch('/api/admin/system/restore', { method: 'POST', body: form })
                              const data = await res.json()
                              if (!res.ok) throw new Error(data?.error || 'Restore gagal')
                              showToast('Restore berhasil. Silakan refresh halaman.', { type: 'success' })
                            } catch (err) {
                              showToast((err as any)?.message || 'Restore gagal', { type: 'error' })
                            } finally {
                              e.currentTarget.value = ''
                            }
                          }}
                          className="hidden"
                          id="restore-input"
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById('restore-input')?.click()}>Restore dari .sql</Button>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Photo */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Foto Profil
              </h3>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                      id="profile-photo-upload"
                    />
                    <label
                      htmlFor="profile-photo-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          {session?.user?.image ? 'Ubah Foto' : 'Upload Foto'}
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Format: JPG, PNG, WEBP. Maksimal 5MB.
                    </p>
                    {profileMessage && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {profileMessage}
                      </p>
                    )}
                    {profileError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {profileError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Information */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informasi Profil
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      defaultValue={session?.user?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={session?.user?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Masukkan email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ceritakan tentang diri Anda"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="default" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            </Card>

            {/* Change Password */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" />
                Ubah Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Lama
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Masukkan password lama"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Konfirmasi password baru"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="default" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Ubah Password
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Overview */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Ringkasan Keamanan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Login Gagal</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {securityLogs.filter(log => log.status === 'FAILED').length}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
              </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
              <div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">IP Diblokir</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {securityLogs.filter(log => log.status === 'BLOCKED').length}
                      </p>
                    </div>
                    <Lock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Login Sukses</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {securityLogs.filter(log => log.status === 'SUCCESS').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
              </div>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Pengaturan Keamanan
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                    <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Aktifkan verifikasi 2 langkah</p>
                  </div>
                  <Button 
                    variant={securitySettings.twoFactorEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSecuritySettings({ twoFactorEnabled: !securitySettings.twoFactorEnabled })}
                  >
                    {securitySettings.twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                  </Button>
              </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                    <p className="font-medium text-gray-900 dark:text-white">Audit Logging</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Catat semua aktivitas sistem</p>
                  </div>
                  <Button 
                    variant={securitySettings.auditLogging ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSecuritySettings({ auditLogging: !securitySettings.auditLogging })}
                  >
                    {securitySettings.auditLogging ? 'Aktif' : 'Nonaktif'}
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">IP Whitelist</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Alamat IP yang diizinkan mengakses sistem</p>
                  <div className="space-y-2">
                    {securitySettings.ipWhitelist.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-mono text-sm">{ip}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeIpFromWhitelist(ip)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {showAddIpForm ? (
                      <div className="flex gap-2">
                <input 
                          type="text"
                          value={newIpAddress}
                          onChange={(e) => setNewIpAddress(e.target.value)}
                          placeholder="192.168.1.100"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <Button size="sm" onClick={addIpToWhitelist}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddIpForm(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setShowAddIpForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah IP
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Logs */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Log Keamanan
                </h3>
                <Button variant="outline" size="sm" onClick={exportSecurityLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Ekspor CSV
                </Button>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    placeholder="Cari user, email, IP, atau aksi..."
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
                <select 
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUCCESS">Sukses</option>
                  <option value="FAILED">Gagal</option>
                  <option value="BLOCKED">Diblokir</option>
                </select>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2">User</th>
                      <th className="text-left py-3 px-2">Aksi</th>
                      <th className="text-left py-3 px-2">IP Address</th>
                      <th className="text-left py-3 px-2">Lokasi</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-2">
              <div>
                            <p className="font-medium text-gray-900 dark:text-white">{log.userFullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{log.userEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-xs">{log.ipAddress}</td>
                        <td className="py-3 px-2 text-xs">{log.location}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                            <span className="ml-1">{log.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-6">
            {/* Help Center */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Pusat Bantuan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <div className="text-center">
                    <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Panduan Pengguna</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Pelajari cara menggunakan sistem dengan efektif</p>
                    <Button variant="outline" size="sm">Baca Panduan</Button>
              </div>
            </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Keamanan</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tips dan praktik keamanan terbaik</p>
                    <Button variant="outline" size="sm">Pelajari</Button>
            </div>
              </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <div className="text-center">
                    <Mail className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Kontak Support</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Hubungi tim support untuk bantuan</p>
                    <Button variant="outline" size="sm">Hubungi</Button>
              </div>
            </div>
              </div>
            </Card>

            {/* FAQ */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pertanyaan Umum</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Bagaimana cara mengubah password?</span>
                      <Plus className="w-5 h-5 text-gray-500" />
                    </div>
                  </button>
              </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Apa yang harus dilakukan jika lupa password?</span>
                      <Plus className="w-5 h-5 text-gray-500" />
              </div>
                  </button>
              </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Bagaimana cara mengaktifkan 2FA?</span>
                      <Plus className="w-5 h-5 text-gray-500" />
            </div>
              </button>
            </div>
              </div>
            </Card>
        </div>
        )}
      </div>
    </AdminLayout>
  )
}
