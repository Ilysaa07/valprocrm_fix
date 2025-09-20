"use client"

import { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { useSession } from 'next-auth/react'

export default function EmployeeAttendancePage() {
  const { data: session } = useSession()
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [getting, setGetting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [todayStatus, setTodayStatus] = useState<{
    hasAttendance: boolean
    hasWFH: boolean
    wfhStatus?: string
    attendance?: any
  } | null>(null)

  function getLocation() {
    if (!navigator.geolocation) {
      setMessage('Geolocation tidak didukung browser ini')
      return
    }
    setGetting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGetting(false)
      },
      (err) => {
        setMessage(err.message)
        setGetting(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => { 
    getLocation() 
    checkTodayStatus()
  }, [])

  const checkTodayStatus = async () => {
    try {
      const res = await fetch('/api/attendance/today')
      if (res.ok) {
        const data = await res.json()
        setTodayStatus({
          hasAttendance: data.hasAttendance,
          hasWFH: data.hasWFH,
          wfhStatus: data.wfhLog?.status,
          attendance: data.attendance
        })
      }
    } catch (error) {
      console.error('Error checking today status:', error)
    }
  }

  async function checkIn() {
    if (!coords) return
    
    setMessage(null)
    
    // Frontend validation
    if (todayStatus?.hasAttendance) {
      setMessage('Anda sudah melakukan absensi hari ini. Tidak dapat melakukan check-in lagi.')
      return
    }
    
    if (todayStatus?.hasWFH) {
      setMessage('Anda sudah mengajukan WFH hari ini. Tidak dapat melakukan absensi kantor.')
      return
    }

    const res = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
    })
    const json = await res.json()
    
    if (res.ok) {
      // Show appropriate message based on late status
      if (json.isLate) {
        setMessage(`✅ ${json.message}`)
      } else {
        setMessage(`✅ ${json.message}`)
      }
      checkTodayStatus() // Refresh status
    } else {
      setMessage(`❌ ${json.error || 'Gagal melakukan check-in'}`)
    }
  }

  async function checkOut() {
    const res = await fetch('/api/attendance/check-out', { method: 'POST' })
    const json = await res.json()
    
    if (res.ok) {
      setMessage(`✅ ${json.message || 'Check-out berhasil'}`)
      checkTodayStatus() // Refresh status
    } else {
      setMessage(`❌ ${json.error || 'Gagal melakukan check-out'}`)
    }
  }

  const getStatusMessage = () => {
    if (!todayStatus) return null
    
    if (todayStatus.hasAttendance) {
      const status = todayStatus.attendance?.status
      const checkInTime = todayStatus.attendance?.checkInTime
      
      let statusText = 'Hadir'
      let statusType = 'success'
      
      if (status === 'LATE') {
        statusText = 'Terlambat'
        statusType = 'warning'
      } else if (status === 'WFH') {
        statusText = 'Work From Home'
        statusType = 'info'
      }
      
      const timeText = checkInTime 
        ? ` (${new Date(checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
        : ''
      
      return {
        type: statusType,
        message: `Anda sudah melakukan absensi hari ini (${statusText}${timeText}).`
      }
    }
    
    if (todayStatus.hasWFH) {
      const statusText = todayStatus.wfhStatus === 'PENDING' ? 'menunggu validasi' : 
                        todayStatus.wfhStatus === 'APPROVED' ? 'disetujui' : 'ditolak'
      return {
        type: 'info',
        message: `Anda sudah mengajukan WFH hari ini (Status: ${statusText}). Fitur absensi kantor tidak tersedia.`
      }
    }
    
    return {
      type: 'info',
      message: 'Anda dapat melakukan absensi hari ini.'
    }
  }

  const getCurrentTime = () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const isLate = (hour > 9) || (hour === 9 && minute > 10)
    
    return {
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isLate: isLate
    }
  }

  const statusInfo = getStatusMessage()
  const currentTime = getCurrentTime()

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Absensi Harian</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Lakukan check-in dan check-out untuk mencatat kehadiran Anda</p>
        </div>

        {/* Current Time */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Waktu Saat Ini</h2>
          <div className={`flex items-center space-x-3 p-4 rounded-xl ${
            currentTime.isLate ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
            'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${currentTime.isLate ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className={`text-lg font-semibold ${
              currentTime.isLate ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'
            }`}>
              {currentTime.time}
            </span>
            {currentTime.isLate && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                (Setelah jam 09:10 - akan tercatat terlambat)
              </span>
            )}
          </div>
        </div>

        {/* Today's Status */}
        {statusInfo && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Status Hari Ini</h2>
            <div className={`flex items-center space-x-3 p-4 rounded-xl ${
              statusInfo.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
              statusInfo.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
              statusInfo.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
              'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                statusInfo.type === 'error' ? 'bg-red-500' :
                statusInfo.type === 'warning' ? 'bg-yellow-500' :
                statusInfo.type === 'info' ? 'bg-blue-500' :
                'bg-green-500'
              }`}></div>
              <span className={`text-sm ${
                statusInfo.type === 'error' ? 'text-red-700 dark:text-red-300' :
                statusInfo.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                statusInfo.type === 'info' ? 'text-blue-700 dark:text-blue-300' :
                'text-green-700 dark:text-green-300'
              }`}>
                {statusInfo.message}
              </span>
            </div>
          </div>
        )}

        {/* Location Status */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Status Lokasi</h2>
          <div className="flex items-center space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <div className={`w-3 h-3 rounded-full ${coords ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Koordinat: {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Memuat lokasi...'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Aksi Absensi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={getLocation} 
              disabled={getting}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-200 dark:border-neutral-700"
            >
              <div className={`w-4 h-4 rounded-full ${getting ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}></div>
              <span className="font-medium">{getting ? 'Mengambil...' : 'Ambil Lokasi'}</span>
            </button>
            
            <button 
              onClick={checkIn} 
              disabled={!coords || todayStatus?.hasAttendance || todayStatus?.hasWFH}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                currentTime.isLate 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 border border-yellow-600' 
                  : 'bg-green-600 text-white hover:bg-green-700 border border-green-600'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white"></div>
              <span className="font-medium">
                {currentTime.isLate ? 'Clock In (Terlambat)' : 'Clock In'}
              </span>
            </button>
            
            <button 
              onClick={checkOut}
              disabled={!todayStatus?.hasAttendance}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-600"
            >
              <div className="w-4 h-4 rounded-full bg-white"></div>
              <span className="font-medium">Clock Out</span>
            </button>
          </div>
          
          {/* Late Warning */}
          {currentTime.isLate && !todayStatus?.hasAttendance && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Anda akan tercatat terlambat karena check-in setelah jam 09:10
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">{message}</span>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}





