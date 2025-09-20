'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { AttendanceStatusBadge } from '@/components/ui/AttendanceStatusBadge'
import { MapPin, Clock, CheckCircle, XCircle, Home, Calendar, AlertTriangle } from 'lucide-react'

interface TodayStatus {
  hasAttendance: boolean
  hasWFH: boolean
  wfhStatus?: string
  attendance?: any
}

interface AttendanceStatusProps {
  title?: string
  showActions?: boolean
  className?: string
}

export function AttendanceStatus({ 
  title = 'Status Absensi Hari Ini', 
  showActions = true,
  className = '' 
}: AttendanceStatusProps) {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkTodayStatus()
  }, [])

  const checkTodayStatus = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-pulse" />,
        status: 'Memuat...',
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        textColor: 'text-gray-600 dark:text-gray-300',
        message: 'Memeriksa status absensi hari ini...'
      }
    }

    if (!todayStatus) {
      return {
        icon: <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />,
        status: 'Belum Absen',
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        textColor: 'text-gray-600 dark:text-gray-300',
        message: 'Anda belum melakukan absensi hari ini'
      }
    }

    if (todayStatus.hasAttendance) {
      const status = todayStatus.attendance?.status || 'PRESENT'
      const statusConfig = {
        PRESENT: {
          icon: <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />,
          status: 'Hadir',
          color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300',
          message: 'Anda sudah melakukan absensi hari ini'
        },
        LATE: {
          icon: <AlertTriangle className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />,
          status: 'Terlambat',
          color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          message: 'Anda terlambat hari ini'
        },
        WFH: {
          icon: <Home className="h-8 w-8 text-purple-500 dark:text-purple-400" />,
          status: 'Work From Home',
          color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-700 dark:text-purple-300',
          message: 'Anda sedang WFH hari ini'
        },
        LEAVE: {
          icon: <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400" />,
          status: 'Izin',
          color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
          message: 'Anda sedang izin hari ini'
        }
      }
      return statusConfig[status] || statusConfig.PRESENT
    }

    if (todayStatus.hasWFH) {
      const statusText = todayStatus.wfhStatus === 'PENDING' ? 'Menunggu Validasi' : 
                        todayStatus.wfhStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'
      return {
        icon: <AlertTriangle className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />,
        status: `WFH ${statusText}`,
        color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        message: `Anda sudah mengajukan WFH hari ini (${statusText})`
      }
    }

    return {
      icon: <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />,
      status: 'Belum Absen',
      color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      textColor: 'text-gray-600 dark:text-gray-300',
      message: 'Anda belum melakukan absensi hari ini'
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Belum ada'
    return new Date(timeString).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className={className}>
      <CardBody>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        
        <div className="space-y-4">
          {/* Status Overview */}
          <div className={`flex items-center p-4 rounded-lg border ${statusInfo.color}`}>
            {statusInfo.icon}
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <p className={`text-lg font-semibold ${statusInfo.textColor}`}>{statusInfo.status}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{statusInfo.message}</p>
            </div>
          </div>

          {/* Time Details */}
          {todayStatus?.hasAttendance && todayStatus.attendance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Check In</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatTime(todayStatus.attendance.checkInTime)}
                </p>
                {todayStatus.attendance.status === 'LATE' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    ⚠️ Terlambat (setelah 09:10)
                  </p>
                )}
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Check Out</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatTime(todayStatus.attendance.checkOutTime)}
                </p>
              </div>
            </div>
          )}

          {/* Location Info */}
          {todayStatus?.hasAttendance && todayStatus.attendance?.checkInLatitude && (
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lokasi Check In</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {todayStatus.attendance.checkInLatitude.toFixed(6)}, {todayStatus.attendance.checkInLongitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {todayStatus?.hasAttendance && todayStatus.attendance?.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Catatan</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{todayStatus.attendance.notes}</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
