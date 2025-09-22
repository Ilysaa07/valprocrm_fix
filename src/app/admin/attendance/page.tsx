"use client"

import { useEffect, useState, useCallback } from 'react'
import { showError, showConfirm } from '@/lib/swal';
import dynamic from 'next/dynamic'
import Image from 'next/image'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'
import Badge from '@/components/ui/Badge'
import { AttendanceStatusBadge } from '@/components/ui/AttendanceStatusBadge'
import { CheckCircle2, XCircle, RefreshCw, User, Calendar, Image as ImageIcon, MapPin } from 'lucide-react'

// Dynamically import LocationMap for WFH validation
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
})

// Dynamically import SimpleDynamicLocationMap for office location settings
const SimpleLocationMap = dynamic(() => import('@/components/map/SimpleDynamicLocationMap'), {
  ssr: false,
  loading: () => <div className="h-[420px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
})

interface OfficeLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
}

interface AttendanceStats {
  todayPresent: number
  todayAbsent: number
  todayWFH: number
  todayLeave: number
  todayLate: number
  totalEmployees: number
}

interface EmployeeAttendance {
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
  status: 'PRESENT' | 'ABSENT' | 'WFH' | 'LEAVE'
  checkInTime: string | null
  checkOutTime: string | null
  notes: string | null
  type: string | null
}

interface LeaveRequest {
  id: string
  userId: string
  type: string
  startDate: string
  endDate: string
  reason: string
  status: string
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    profilePicture: string | null
  }
}

interface WfhLog {
  id: string
  userId: string
  activityDescription: string
  logTime: string
  status: string
  createdAt: string
  screenshotUrl: string
  latitude: number
  longitude: number
  adminNotes?: string
  user: {
    id: string
    fullName: string
    email: string
    profilePicture: string | null
  }
}

interface CalendarData {
  employeeId: string
  employeeName: string
  employeeEmail: string
  employeeAvatar: string | null
  days: Array<{
    day: number
    status: string
    notes: string | null
    type: string | null
    checkInTime: string | null
    checkOutTime: string | null
  }>
}

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'calendar' | 'requests' | 'location'>('overview')
  const [, setLocations] = useState<OfficeLocation[]>([])
  const [selected, setSelected] = useState<OfficeLocation | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [radius, setRadius] = useState<number>(50)
  const [name, setName] = useState<string>('Kantor Pusat')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    todayPresent: 0,
    todayAbsent: 0,
    todayWFH: 0,
    todayLeave: 0,
    todayLate: 0,
    totalEmployees: 0
  })
  const [employeeAttendance, setEmployeeAttendance] = useState<EmployeeAttendance[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [wfhLogs, setWfhLogs] = useState<WfhLog[]>([])
  const [calendarData, setCalendarData] = useState<CalendarData[]>([])
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [wfhNotes, setWfhNotes] = useState<Record<string, string>>({})
  const { showToast } = useToast()

  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [locationRes, attendanceRes, usersRes, requestsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/admin/attendance'),
        fetch('/api/admin/users'),
        fetch('/api/admin/attendance/requests')
      ])

      // Load office location
      if (locationRes.ok) {
        const locationJson = await locationRes.json()
        const data: OfficeLocation[] = locationJson.data || []
        setLocations(data)
        const last = data[0]
        if (last) {
          setSelected(last)
          setName(last.name)
          setLat(last.latitude)
          setLng(last.longitude)
          setRadius(last.radius)
        }
      }

      // Load attendance stats from admin API
      if (attendanceRes.ok) {
        const attendanceJson = await attendanceRes.json()
        const attendanceData = attendanceJson.data || []
        const summary = attendanceJson.summary || {}
        
        setAttendanceStats({
          todayPresent: summary.present || 0,
          todayWFH: summary.wfh || 0,
          todayLeave: summary.leave || 0,
          todayAbsent: summary.absent || 0,
          todayLate: summary.late || 0,
          totalEmployees: summary.total || 0
        })
        
        // Store employee attendance data for details view
        setEmployeeAttendance(attendanceData)
      }

      // Load total employees count as fallback
      if (usersRes.ok) {
        const usersJson = await usersRes.json()
        const users = usersJson.users || []
        setAttendanceStats(prev => ({
          ...prev,
          totalEmployees: users.length
        }))
      }

      // Load pending requests
      if (requestsRes.ok) {
        const requestsJson = await requestsRes.json()
        setLeaveRequests(requestsJson.leaveRequests || [])
        // Don't set WFH logs here to avoid duplication
      }

      // Load enhanced WFH logs for validation
      const wfhRes = await fetch('/api/wfh-logs/pending')
      if (wfhRes.ok) {
        const wfhJson = await wfhRes.json()
        const wfhData = wfhJson.data || []
        
        // Remove duplicates based on ID
        const uniqueWfhLogs = wfhData.filter((log: WfhLog, index: number, self: WfhLog[]) => 
          index === self.findIndex((l: WfhLog) => l.id === log.id)
        )
        
        setWfhLogs(uniqueWfhLogs)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendar = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/attendance/calendar?month=${calendarMonth}&year=${calendarYear}`)
      if (res.ok) {
        const json = await res.json()
        setCalendarData(json.data || [])
      }
    } catch (e) {
      console.error('Failed to load calendar:', e)
    }
  }, [calendarMonth, calendarYear])

  // Auto-refresh attendance data every 30 seconds
  useEffect(() => { 
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load calendar when month/year changes
  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  async function save() {
    try {
      const body = { id: selected?.id, name, latitude: lat ?? -6.2, longitude: lng ?? 106.8, radius }
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan lokasi')
      await load()
      await showError("Error!", 'Lokasi disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan lokasi'
      await showError("Error!", msg)
    }
  }

  async function handleRequest(type: 'leave' | 'wfh', id: string, action: 'approve' | 'reject', adminNotes?: string) {
    try {
      const res = await fetch('/api/admin/attendance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action, adminNotes })
      })
      
      if (res.ok) {
        await load() // Reload data
        await showError("Error!", `${type === 'leave' ? 'Permohonan izin' : 'Log WFH'} berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`)
      } else {
        const json = await res.json()
        throw new Error(json.error || 'Gagal memproses permintaan')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memproses permintaan'
      await showError("Error!", msg)
    }
  }

  async function validateWfhLog(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const confirmMsg = status === 'APPROVED' ? 'Setujui log WFH ini?' : 'Tolak log WFH ini?'
      const result = await showConfirm("Konfirmasi", confirmMsg, "Ya", "Batal");
      if (!result.isConfirmed) return

      setProcessingId(id)
      const adminNotes = wfhNotes[id]?.trim() || undefined
      const res = await fetch(`/api/wfh-logs/${id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes })
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error || 'Gagal memproses validasi', { title: 'Error', type: 'error' })
        return
      }
      showToast(json.message || 'Validasi berhasil', { title: 'Sukses', type: 'success' })
      setWfhNotes(prev => ({ ...prev, [id]: '' }))
      await load() // Reload data
    } catch {
      showToast('Terjadi kesalahan saat memproses', { title: 'Error', type: 'error' })
    } finally {
      setProcessingId(null)
    }
  }


  function changeMonth(delta: number) {
    let m = calendarMonth + delta
    let y = calendarYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setCalendarMonth(m)
    setCalendarYear(y)
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manajemen Absensi Terpadu</h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto whitespace-nowrap -mx-6 px-6 scroll-smooth">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Detail Karyawan
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Validasi & Permintaan ({leaveRequests.length + wfhLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'location'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Pengaturan Lokasi
            </button>
          </nav>
        </div>

        {loading && <div className="text-center py-8 text-gray-600 dark:text-gray-400">Memuat...</div>}
        {error && <div className="text-red-600 dark:text-red-400 text-center">{error}</div>}

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Attendance Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Hadir Hari Ini</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attendanceStats.todayPresent}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-600 dark:bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Terlambat</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{attendanceStats.todayLate}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <div className="w-6 h-6 bg-purple-600 dark:bg-purple-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">WFH</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{attendanceStats.todayWFH}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Izin</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendanceStats.todayLeave}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <div className="w-6 h-6 bg-red-600 dark:bg-red-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tidak Hadir</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{attendanceStats.todayAbsent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ringkasan Kehadiran Hari Ini</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total Karyawan: <span className="font-semibold text-gray-900 dark:text-white">{attendanceStats.totalEmployees}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Tingkat Kehadiran: <span className="font-semibold text-green-600 dark:text-green-400">
                    {attendanceStats.totalEmployees > 0 
                      ? Math.round(((attendanceStats.todayPresent + attendanceStats.todayWFH) / attendanceStats.totalEmployees) * 100)
                      : 0}%
                  </span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Present: <span className="font-semibold text-green-600 dark:text-green-400">{attendanceStats.todayPresent}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Terlambat: <span className="font-semibold text-yellow-600 dark:text-yellow-400">{attendanceStats.todayLate}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">WFH: <span className="font-semibold text-purple-600 dark:text-purple-400">{attendanceStats.todayWFH}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Izin: <span className="font-semibold text-blue-600 dark:text-blue-400">{attendanceStats.todayLeave}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Absen: <span className="font-semibold text-red-600 dark:text-red-400">{attendanceStats.todayAbsent}</span></p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'details' ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detail Kehadiran Karyawan Hari Ini</h3>
              {/* Mobile: Card list */}
              <div className="md:hidden space-y-3">
                {employeeAttendance.map((employee, index) => (
                  <div key={`employee-card-${employee.userId}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {employee.userAvatar ? (
                        <Image className="h-12 w-12 rounded-full" src={employee.userAvatar} alt={employee.userName} width={48} height={48} />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-base font-semibold text-gray-700 dark:text-gray-300">{employee.userName.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{employee.userName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee.userEmail}</p>
                          </div>
                          <AttendanceStatusBadge 
                            status={employee.status as 'PRESENT' | 'LATE' | 'ABSENT' | 'SICK' | 'LEAVE' | 'WFH'} 
                            size="sm"
                            showIcon={true}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Check-in</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{employee.checkInTime ? new Date(employee.checkInTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : '-'}</p>
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Check-out</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{employee.checkOutTime ? new Date(employee.checkOutTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : '-'}</p>
                          </div>
                        </div>
                        {employee.notes && (
                          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{employee.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Karyawan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check-in</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check-out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employeeAttendance.map((employee, index) => (
                      <tr key={`employee-${employee.userId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {employee.userAvatar ? (
                                <Image className="h-10 w-10 rounded-full" src={employee.userAvatar} alt={employee.userName} width={40} height={40} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {employee.userName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.userName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{employee.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AttendanceStatusBadge 
                            status={employee.status as 'PRESENT' | 'LATE' | 'ABSENT' | 'SICK' | 'LEAVE' | 'WFH'} 
                            size="sm"
                            showIcon={true}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {employee.checkInTime ? new Date(employee.checkInTime).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {employee.checkOutTime ? new Date(employee.checkOutTime).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {employee.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kalender Kehadiran Karyawan</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)} className="px-3 py-2 min-h-[40px] border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">Prev</button>
                <div className="min-w-[160px] text-center font-medium text-gray-900 dark:text-white">
                  {new Date(calendarYear, calendarMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={() => changeMonth(1)} className="px-3 py-2 min-h-[40px] border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">Next</button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                {calendarData.map((employee, index) => (
                  <div key={`calendar-employee-${employee.employeeId}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      {employee.employeeAvatar ? (
                        <Image className="h-8 w-8 rounded-full mr-3" src={employee.employeeAvatar} alt={employee.employeeName} width={32} height={32} />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {employee.employeeName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{employee.employeeName}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{employee.employeeEmail}</p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-7 gap-1 min-w-[560px]">
                      {days.map((day, dayIndex) => (
                        <div key={`day-header-${day}-${dayIndex}`} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                          {day}
                        </div>
                      ))}
                      {employee.days.map((dayData, dayIndex) => (
                        <div key={`day-${employee.employeeId}-${dayData.day}-${dayIndex}`} className="text-center p-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{dayData.day}</div>
                          <div className={`inline-block w-2 h-2 rounded-full ${
                            dayData.status === 'PRESENT' ? 'bg-green-500' :
                            dayData.status === 'WFH' ? 'bg-purple-500' :
                            dayData.status === 'LEAVE' ? 'bg-blue-500' :
                            'bg-gray-300 dark:bg-gray-600'
                          }`} title={dayData.status}></div>
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          <div className="space-y-6">
            {/* Leave Requests */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permohonan Izin ({leaveRequests.length})</h3>
              {leaveRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada permohonan izin yang menunggu</p>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request, index) => (
                    <div key={`leave-request-${request.id}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {request.user.profilePicture ? (
                            <Image className="h-10 w-10 rounded-full mr-3" src={request.user.profilePicture} alt={request.user.fullName} width={40} height={40} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {request.user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{request.user.fullName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{request.user.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {request.type} • {new Date(request.startDate).toLocaleDateString('id-ID')} - {new Date(request.endDate).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto sm:ml-4">
                          <button
                            onClick={() => handleRequest('leave', request.id, 'approve')}
                            className="px-3 py-2 min-h-[44px] bg-green-600 text-white rounded hover:bg-green-700 transition-colors w-full sm:w-auto"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Catatan admin (opsional):')
                              handleRequest('leave', request.id, 'reject', notes || undefined)
                            }}
                            className="px-3 py-2 min-h-[44px] bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full sm:w-auto"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced WFH Logs - Full Integration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Validasi WFH ({wfhLogs.length})</h3>
                <Button variant="outline" onClick={load} disabled={loading} className="flex items-center gap-2">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </Button>
              </div>
              
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`loading-skeleton-${i}`} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  ))}
                </div>
              )}
              
              {error && <div className="text-red-600 dark:text-red-400 text-center py-4">{error}</div>}
              
              {!loading && wfhLogs.length === 0 && (
                <div className="text-gray-600 dark:text-gray-300 text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    <p>Tidak ada log WFH yang menunggu validasi</p>
                  </div>
                </div>
              )}
              
              {!loading && wfhLogs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wfhLogs.map((log, index) => (
                    <div key={`wfh-log-${log.id}-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {log.user.profilePicture ? (
                            <Image className="h-10 w-10 rounded-full mr-3" src={log.user.profilePicture} alt={log.user.fullName} width={40} height={40} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {log.user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              {log.user.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{log.user.email}</div>
                          </div>
                        </div>
                        <Badge variant="secondary">WFH</Badge>
                      </div>
                      
                      <div className="text-sm text-gray-800 dark:text-gray-100">{log.activityDescription}</div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Log time: {new Date(log.logTime).toLocaleString('id-ID')}
                      </div>

                      {/* Screenshot and Location Info */}
                      <div className="flex items-center gap-3">
                        {log.screenshotUrl && (
                          <a 
                            href={log.screenshotUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-blue-600 dark:text-blue-400 underline text-sm flex items-center gap-1 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" /> Lihat Screenshot
                          </a>
                        )}
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-1">
                          <MapPin className="w-3 h-3" /> 
                          {log.latitude && log.longitude ? 
                            `Koordinat: ${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` : 
                            'Lokasi tidak tersedia'
                          }
                        </div>
                      </div>

                      {/* Location Map - Always Visible */}
                      {log.latitude && log.longitude && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi WFH</label>
                          <div className="h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <LocationMap
                              latitude={log.latitude}
                              longitude={log.longitude}
                              radius={0}
                              height="192px"
                            />
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Catatan Admin (opsional)
                        </label>
                        <textarea
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Tulis catatan untuk karyawan..."
                          value={wfhNotes[log.id] || ''}
                          onChange={(e) => setWfhNotes(prev => ({ ...prev, [log.id]: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 flex-col sm:flex-row">
                        <Button
                          onClick={() => validateWfhLog(log.id, 'APPROVED')}
                          disabled={processingId === log.id}
                          className="flex items-center gap-2 flex-1 bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
                        >
                          {processingId === log.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Setujui
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => validateWfhLog(log.id, 'REJECTED')}
                          disabled={processingId === log.id}
                          className="flex items-center gap-2 flex-1 min-h-[44px]"
                        >
                          {processingId === log.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lokasi</span>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 dark:placeholder-gray-400" 
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</span>
                    <input 
                      type="number" 
                      step="any"
                      value={lat ?? ''} 
                      onChange={e => setLat(Number(e.target.value))} 
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 dark:placeholder-gray-400" 
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</span>
                    <input 
                      type="number" 
                      step="any"
                      value={lng ?? ''} 
                      onChange={e => setLng(Number(e.target.value))} 
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 dark:placeholder-gray-400" 
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius (meter)</span>
                  <input 
                    type="number" 
                    value={radius} 
                    onChange={e => setRadius(Number(e.target.value))} 
                    className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 dark:placeholder-gray-400" 
                  />
                </label>
                <button 
                  onClick={save} 
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Simpan Lokasi
                </button>
              </div>
              <div>
                <SimpleLocationMap
                  latitude={lat ?? undefined}
                  longitude={lng ?? undefined}
                  radius={radius}
                  editable
                  onLocationChange={(la: number, lo: number) => { setLat(la); setLng(lo) }}
                  height="420px"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}




