"use client"

import React, { useState } from 'react'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Smartphone,
  Database,
  Network,
  FileText,
  Download,
  RefreshCw,
  Settings,
  Bell,
  UserCheck,
  Globe,
  Server
} from 'lucide-react'

interface SecurityLog {
  id: string
  timestamp: string
  user: string
  action: string
  ipAddress: string
  location: string
  status: 'success' | 'warning' | 'danger'
  details: string
}

interface SecuritySetting {
  id: string
  name: string
  description: string
  enabled: boolean
  critical: boolean
  category: string
}

const securitySettings: SecuritySetting[] = [
  {
    id: '1',
    name: 'Two-Factor Authentication',
    description: 'Wajibkan 2FA untuk semua pengguna admin',
    enabled: true,
    critical: true,
    category: 'Authentication'
  },
  {
    id: '2',
    name: 'Password Policy',
    description: 'Kebijakan password yang kuat (min. 12 karakter, simbol, angka)',
    enabled: true,
    critical: true,
    category: 'Authentication'
  },
  {
    id: '3',
    name: 'Session Timeout',
    description: 'Auto logout setelah 30 menit tidak aktif',
    enabled: true,
    critical: false,
    category: 'Session'
  },
  {
    id: '4',
    name: 'IP Whitelist',
    description: 'Batasi akses hanya dari IP yang diizinkan',
    enabled: false,
    critical: false,
    category: 'Network'
  },
  {
    id: '5',
    name: 'Login Attempts',
    description: 'Blokir akun setelah 5 percobaan login gagal',
    enabled: true,
    critical: true,
    category: 'Authentication'
  },
  {
    id: '6',
    name: 'Audit Logging',
    description: 'Catat semua aktivitas penting pengguna',
    enabled: true,
    critical: false,
    category: 'Monitoring'
  },
  {
    id: '7',
    name: 'Data Encryption',
    description: 'Enkripsi data sensitif di database',
    enabled: true,
    critical: true,
    category: 'Data'
  },
  {
    id: '8',
    name: 'Backup Encryption',
    description: 'Enkripsi semua backup data',
    enabled: true,
    critical: true,
    category: 'Data'
  }
]

const securityLogs: SecurityLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:25',
    user: 'admin@company.com',
    action: 'Login berhasil',
    ipAddress: '192.168.1.100',
    location: 'Jakarta, Indonesia',
    status: 'success',
    details: 'Login dari browser Chrome versi 120.0'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:25:10',
    user: 'user@company.com',
    action: 'Login gagal',
    ipAddress: '192.168.1.101',
    location: 'Bandung, Indonesia',
    status: 'warning',
    details: 'Password salah - percobaan ke-3'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:20:15',
    user: 'admin@company.com',
    action: 'Ubah pengaturan keamanan',
    ipAddress: '192.168.1.100',
    location: 'Jakarta, Indonesia',
    status: 'success',
    details: 'Mengaktifkan 2FA untuk semua pengguna'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:15:30',
    user: 'unknown',
    action: 'Percobaan akses ditolak',
    ipAddress: '203.45.67.89',
    location: 'Unknown',
    status: 'danger',
    details: 'IP tidak ada dalam whitelist'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:10:45',
    user: 'manager@company.com',
    action: 'Download laporan sensitif',
    ipAddress: '192.168.1.102',
    location: 'Surabaya, Indonesia',
    status: 'success',
    details: 'Laporan keuangan Q4 2023'
  }
]

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'danger': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'danger': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Shield className="h-12 w-12 text-red-600" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Keamanan Sistem</h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Kelola keamanan sistem, monitor aktivitas, dan lindungi data perusahaan
        </p>
      </div>

      {/* Security Score Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Skor Keamanan</h2>
            <p className="text-slate-600 dark:text-slate-400">Sistem Anda memiliki tingkat keamanan yang sangat baik</p>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-green-600">92</div>
            <div className="text-sm text-green-600 font-medium">/ 100</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Fitur Aktif</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Vulnerability</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Monitoring</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Shield },
            { id: 'settings', name: 'Pengaturan', icon: Settings },
            { id: 'logs', name: 'Log Keamanan', icon: FileText },
            { id: 'monitoring', name: 'Monitoring', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pengguna Aktif</h3>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Pengguna online saat ini</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <Network className="h-8 w-8 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Akses Aman</h3>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">1,247</div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Login berhasil hari ini</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Peringatan</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">3</div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Percobaan login mencurigakan</p>
            </div>
          </div>

          {/* Recent Security Events */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Event Keamanan Terbaru</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {securityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className={`p-2 rounded-full ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900 dark:text-white">{log.action}</h4>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {log.user} • {log.ipAddress} • {log.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Security Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pengaturan Keamanan</h3>
              <p className="text-slate-600 dark:text-slate-400">Konfigurasi fitur keamanan sistem</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {securitySettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-slate-900 dark:text-white">{setting.name}</h4>
                        {setting.critical && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                            Critical
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{setting.description}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{setting.category}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        className="sr-only peer"
                        readOnly
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ubah Password</h3>
              <p className="text-slate-600 dark:text-slate-400">Perbarui password akun Anda</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-white"
                      placeholder="Masukkan password saat ini"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Minimal 12 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Ulangi password baru"
                  />
                </div>

                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Log Keamanan</h3>
                <p className="text-slate-600 dark:text-slate-400">Riwayat aktivitas keamanan sistem</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {securityLogs.map((log) => (
                <div key={log.id} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className={`p-2 rounded-full ${getStatusColor(log.status)}`}>
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900 dark:text-white">{log.action}</h4>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{log.user}</span> • {log.ipAddress} • {log.location}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Real-time Monitoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Aktivitas Real-time</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Login aktif</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Sesi aktif</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Percobaan login</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">3</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Status Sistem</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Firewall</span>
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Aktif
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Backup</span>
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Terbaru
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Alerts */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Peringatan Keamanan</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Tidak ada peringatan aktif</h4>
                <p className="text-slate-600 dark:text-slate-400">Sistem keamanan berjalan dengan baik</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
