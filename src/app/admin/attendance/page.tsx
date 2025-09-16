"use client"

import { useEffect, useState } from 'react'
import { showSuccess, showError, showConfirm } from '@/lib/swal';
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/layout/AdminLayout'

// Dynamically import SimpleDynamicLocationMap to avoid SSR issues
  const LocationMap = dynamic(() => import('@/components/map/SimpleDynamicLocationMap'), {
    ssr: false,
    loading: () => <div className="h-[420px] bg-gray-100 rounded animate-pulse" />
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
        setWfhLogs(requestsJson.wfhLogs || [])
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function loadCalendar() {
    try {
      const res = await fetch(`/api/admin/attendance/calendar?month=${calendarMonth}&year=${calendarYear}`)
      if (res.ok) {
        const json = await res.json()
        setCalendarData(json.data || [])
      }
    } catch (e) {
      console.error('Failed to load calendar:', e)
    }
  }

  // Auto-refresh attendance data every 30 seconds
  useEffect(() => { 
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load calendar when month/year changes
  useEffect(() => {
    loadCalendar()
  }, [calendarMonth, calendarYear])

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
          <h1 className="text-2xl font-semibold">Manajemen Absensi Terpadu</h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Detail Karyawan
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Permintaan ({leaveRequests.length + wfhLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total Karyawan: <span className="font-semibold">{attendanceStats.totalEmployees}</span></p>
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
              <div className="overflow-x-auto">
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
                    {employeeAttendance.map((employee) => (
                      <tr key={employee.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {employee.userAvatar ? (
                                <img className="h-10 w-10 rounded-full" src={employee.userAvatar} alt={employee.userName} />
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                            employee.status === 'WFH' ? 'bg-purple-100 text-purple-800' :
                            employee.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {employee.status === 'PRESENT' ? 'Hadir' :
                             employee.status === 'WFH' ? 'WFH' :
                             employee.status === 'LEAVE' ? 'Izin' :
                             'Tidak Hadir'}
                          </span>
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
              <h3 className="text-lg font-semibold text-gray-900">Kalender Kehadiran Karyawan</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 border rounded hover:bg-gray-50">Prev</button>
                <div className="min-w-[160px] text-center font-medium">
                  {new Date(calendarYear, calendarMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                {calendarData.map((employee) => (
                  <div key={employee.employeeId} className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      {employee.employeeAvatar ? (
                        <img className="h-8 w-8 rounded-full mr-3" src={employee.employeeAvatar} alt={employee.employeeName} />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-700">
                            {employee.employeeName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{employee.employeeName}</h4>
                        <p className="text-sm text-gray-500">{employee.employeeEmail}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {days.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                      {employee.days.map((dayData) => (
                        <div key={dayData.day} className="text-center p-1">
                          <div className="text-sm font-medium text-gray-900">{dayData.day}</div>
                          <div className={`inline-block w-2 h-2 rounded-full ${
                            dayData.status === 'PRESENT' ? 'bg-green-500' :
                            dayData.status === 'WFH' ? 'bg-purple-500' :
                            dayData.status === 'LEAVE' ? 'bg-blue-500' :
                            'bg-gray-300'
                          }`} title={dayData.status}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          <div className="space-y-6">
            {/* Leave Requests */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permohonan Izin ({leaveRequests.length})</h3>
              {leaveRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada permohonan izin yang menunggu</p>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {request.user.profilePicture ? (
                            <img className="h-10 w-10 rounded-full mr-3" src={request.user.profilePicture} alt={request.user.fullName} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700">
                                {request.user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{request.user.fullName}</h4>
                            <p className="text-sm text-gray-500">{request.user.email}</p>
                            <p className="text-sm text-gray-600">
                              {request.type} • {new Date(request.startDate).toLocaleDateString('id-ID')} - {new Date(request.endDate).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequest('leave', request.id, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Catatan admin (opsional):')
                              handleRequest('leave', request.id, 'reject', notes || undefined)
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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

            {/* WFH Logs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log WFH ({wfhLogs.length})</h3>
              {wfhLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada log WFH yang menunggu validasi</p>
              ) : (
                <div className="space-y-4">
                  {wfhLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {log.user.profilePicture ? (
                            <img className="h-10 w-10 rounded-full mr-3" src={log.user.profilePicture} alt={log.user.fullName} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700">
                                {log.user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{log.user.fullName}</h4>
                            <p className="text-sm text-gray-500">{log.user.email}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(log.logTime).toLocaleDateString('id-ID')} • {new Date(log.logTime).toLocaleTimeString('id-ID')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{log.activityDescription}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequest('wfh', log.id, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Catatan admin (opsional):')
                              handleRequest('wfh', log.id, 'reject', notes || undefined)
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Nama Lokasi</span>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Latitude</span>
                    <input 
                      type="number" 
                      step="any"
                      value={lat ?? ''} 
                      onChange={e => setLat(Number(e.target.value))} 
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Longitude</span>
                    <input 
                      type="number" 
                      step="any"
                      value={lng ?? ''} 
                      onChange={e => setLng(Number(e.target.value))} 
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Radius (meter)</span>
                  <input 
                    type="number" 
                    value={radius} 
                    onChange={e => setRadius(Number(e.target.value))} 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
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
                <LocationMap
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




