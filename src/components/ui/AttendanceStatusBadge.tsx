'use client'

import { cn } from '@/lib/utils'

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'SICK' | 'LEAVE' | 'WFH'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const statusConfig = {
  PRESENT: {
    label: 'Hadir',
    icon: '✓',
    className: 'attendance-status-indicator present',
    ariaLabel: 'Status kehadiran: Hadir'
  },
  LATE: {
    label: 'Terlambat',
    icon: '⚠',
    className: 'attendance-status-indicator late',
    ariaLabel: 'Status kehadiran: Terlambat'
  },
  ABSENT: {
    label: 'Tidak Hadir',
    icon: '✗',
    className: 'attendance-status-indicator absent',
    ariaLabel: 'Status kehadiran: Tidak Hadir'
  },
  SICK: {
    label: 'Sakit',
    icon: '🏥',
    className: 'attendance-status-indicator sick',
    ariaLabel: 'Status kehadiran: Sakit'
  },
  LEAVE: {
    label: 'Izin',
    icon: '📅',
    className: 'attendance-status-indicator leave',
    ariaLabel: 'Status kehadiran: Izin'
  },
  WFH: {
    label: 'Work From Home',
    icon: '🏠',
    className: 'attendance-status-indicator wfh',
    ariaLabel: 'Status kehadiran: Work From Home'
  }
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2'
}

export function AttendanceStatusBadge({ 
  status, 
  className, 
  size = 'md',
  showIcon = true 
}: AttendanceStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors',
        className
      )}
      role="status"
      aria-label={config.ariaLabel}
    >
      {showIcon && (
        <span 
          className="text-xs" 
          aria-hidden="true"
        >
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  )
}

// Utility function to get status color classes
export function getAttendanceStatusClasses(status: AttendanceStatus) {
  return statusConfig[status].className
}

// Utility function to get status label
export function getAttendanceStatusLabel(status: AttendanceStatus) {
  return statusConfig[status].label
}

// Utility function to get status icon
export function getAttendanceStatusIcon(status: AttendanceStatus) {
  return statusConfig[status].icon
}
