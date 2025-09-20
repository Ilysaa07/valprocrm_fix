'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AttendanceStatusBadge } from '@/components/ui/AttendanceStatusBadge'

export interface AttendanceData {
  userId: string
  userName: string
  status: 'PRESENT' | 'ABSENT' | 'SICK' | 'LEAVE' | 'WFH'
  checkInTime?: string
  checkOutTime?: string
  location?: string
  notes?: string
}

interface AttendanceStatusProps {
  attendanceData: AttendanceData | null
  showActions?: boolean
  showLocation?: boolean
  title?: string
  className?: string
}

export function AttendanceStatus({ 
  attendanceData, 
  showActions = false, 
  showLocation = false,
  title,
  className = '' 
}: AttendanceStatusProps) {
  const getStatusColor = (status: AttendanceData['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'ABSENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'SICK':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'LEAVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'WFH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusText = (status: AttendanceData['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'Hadir'
      case 'LATE':
        return 'Terlambat'
      case 'ABSENT':
        return 'Tidak Hadir'
      case 'SICK':
        return 'Sakit'
      case 'LEAVE':
        return 'Izin'
      case 'WFH':
        return 'Work From Home'
      default:
        return 'Belum Diketahui'
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    const time = new Date(timeString)
    return time.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!attendanceData) {
    return (
      <Card className={className}>
        <CardBody>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {title}
            </h3>
          )}
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Data kehadiran tidak tersedia
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardBody>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status Kehadiran
            </span>
            <AttendanceStatusBadge 
              status={attendanceData.status} 
              size="sm"
              showIcon={true}
            />
          </div>

          {/* Check In/Out Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check In</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(attendanceData.checkInTime)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check Out</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(attendanceData.checkOutTime)}
              </p>
            </div>
          </div>

          {/* Location */}
          {showLocation && attendanceData.location && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">📍</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {attendanceData.location}
              </span>
            </div>
          )}

          {/* Notes */}
          {attendanceData.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Catatan</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {attendanceData.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2 pt-2">
              {!attendanceData.checkInTime ? (
                <Button className="flex-1">
                  Check In
                </Button>
              ) : !attendanceData.checkOutTime ? (
                <Button className="flex-1">
                  Check Out
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" disabled>
                  Sudah Check Out
                </Button>
              )}
              
              <Button variant="outline">
                Edit
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
