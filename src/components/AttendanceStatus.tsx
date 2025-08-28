'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { MapPin, Clock, CheckCircle, XCircle, Home, Calendar } from 'lucide-react'

interface AttendanceData {
  status: 'PRESENT' | 'ABSENT' | 'WFH' | 'LEAVE' | null
  checkInTime: string | null
  checkOutTime: string | null
  location?: string
  notes?: string
}

interface AttendanceStatusProps {
  attendance: AttendanceData
  title?: string
  showActions?: boolean
  className?: string
}

export function AttendanceStatus({ 
  attendance, 
  title = 'Status Absensi Hari Ini', 
  showActions = true,
  className = '' 
}: AttendanceStatusProps) {
  const getStatusBadge = () => {
    if (!attendance.status) {
      return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Belum Absen</span>
    }

    const styles = {
      PRESENT: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
      ABSENT: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
      WFH: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
      LEAVE: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200'
    }

    const labels = {
      PRESENT: 'Hadir',
      ABSENT: 'Tidak Hadir',
      WFH: 'Work From Home',
      LEAVE: 'Izin'
    }

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[attendance.status]}`}>
        {labels[attendance.status]}
      </span>
    )
  }

  const getStatusIcon = () => {
    if (!attendance.status) {
      return <Clock className="h-8 w-8 text-gray-400" />
    }

    const icons = {
      PRESENT: <CheckCircle className="h-8 w-8 text-green-500" />,
      ABSENT: <XCircle className="h-8 w-8 text-red-500" />,
      WFH: <Home className="h-8 w-8 text-purple-500" />,
      LEAVE: <Calendar className="h-8 w-8 text-blue-500" />
    }

    return icons[attendance.status]
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Belum ada'
    return new Date(timeString).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusColor = () => {
    if (!attendance.status) return 'bg-gray-50 border-gray-200'
    
    const colors = {
      PRESENT: 'bg-green-50 border-green-200',
      ABSENT: 'bg-red-50 border-red-200',
      WFH: 'bg-purple-50 border-purple-200',
      LEAVE: 'bg-blue-50 border-blue-200'
    }
    
    return colors[attendance.status]
  }

  return (
    <Card className={className}>
      <CardBody>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        
        <div className="space-y-4">
          {/* Status Overview */}
          <div className={`flex items-center p-4 rounded-lg border ${getStatusColor()}`}>
            {getStatusIcon()}
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              {getStatusBadge()}
            </div>
          </div>

          {/* Time Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Check In
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatTime(attendance.checkInTime)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Check Out
              </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatTime(attendance.checkOutTime)}
              </span>
            </div>

            {attendance.location && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Lokasi
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {attendance.location}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {!attendance.status ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Belum ada absensi hari ini
                  </p>
                  <Link 
                    href="/employee/attendance" 
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clock In
                  </Link>
                </div>
              ) : attendance.status === 'PRESENT' && !attendance.checkOutTime ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Anda sudah check in hari ini
                  </p>
                  <Link 
                    href="/employee/attendance" 
                    className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clock Out
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Absensi hari ini sudah selesai
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {attendance.notes && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Catatan:</strong> {attendance.notes}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
