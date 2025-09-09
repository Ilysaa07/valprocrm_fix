'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react'
import { useState, useMemo } from 'react'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'attendance' | 'leave' | 'wfh' | 'task' | 'meeting' | 'holiday' | 'birthday'
  status?: 'present' | 'absent' | 'late' | 'approved' | 'pending' | 'rejected' | 'completed' | 'overdue'
  description?: string
  startTime?: string
  endTime?: string
  participants?: string[]
  location?: string
  priority?: 'low' | 'medium' | 'high'
}

interface DashboardCalendarProps {
  title?: string
  events: CalendarEvent[]
  view?: 'month' | 'week' | 'day'
  showEventDetails?: boolean
  showStatus?: boolean
  showTime?: boolean
  showParticipants?: boolean
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  className?: string
}

export function DashboardCalendar({ 
  title = 'Kalender', 
  events, 
  view = 'month',
  showEventDetails = true,
  showStatus = true,
  showTime = true,
  showParticipants = true,
  onEventClick,
  onDateClick,
  className = '' 
}: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const getEventIcon = (type: string) => {
    const icons = {
      attendance: Users,
      leave: Calendar,
      wfh: Home,
      task: CheckCircle,
      meeting: Clock,
      holiday: Calendar,
      birthday: Calendar
    }
    return icons[type as keyof typeof icons] || Calendar
  }

  const getEventColor = (type: string) => {
    const colors = {
      attendance: 'bg-blue-100 text-blue-800 border-blue-200',
      leave: 'bg-green-100 text-green-800 border-green-200',
      wfh: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      task: 'bg-purple-100 text-purple-800 border-purple-200',
      meeting: 'bg-orange-100 text-orange-800 border-orange-200',
      holiday: 'bg-red-100 text-red-800 border-red-200',
      birthday: 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      present: 'Hadir',
      late: 'Terlambat',
      absent: 'Tidak Hadir',
      approved: 'Disetujui',
      pending: 'Menunggu',
      rejected: 'Ditolak',
      completed: 'Selesai',
      overdue: 'Terlambat'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority as keyof typeof priority] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const time = new Date(`2000-01-01T${timeString}`)
    return time.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMonthData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getWeekData = () => {
    const current = new Date(currentDate)
    const week = []
    const start = new Date(current)
    start.setDate(start.getDate() - start.getDay())
    
    for (let i = 0; i < 7; i++) {
      week.push(new Date(start))
      start.setDate(start.getDate() + 1)
    }
    
    return week
  }

  const getDayData = () => {
    return [currentDate]
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        newDate.setDate(newDate.getDate() + 7)
      }
      return newDate
    })
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1)
      } else {
        newDate.setDate(newDate.getDate() + 1)
      }
      return newDate
    })
  }

  const renderCalendarHeader = () => {
    const getNavigationButtons = () => {
      switch (view) {
        case 'month':
          return (
            <>
              <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )
        case 'week':
          return (
            <>
              <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )
        case 'day':
          return (
            <>
              <button onClick={() => navigateDay('prev')} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigateDay('next')} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )
        default:
          return null
      }
    }

    return (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center space-x-2">
          {getNavigationButtons()}
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
          >
            Hari Ini
          </button>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const days = getMonthData()
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
        
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date)
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                min-h-[80px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                ${isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}
                ${isSelected(date) ? 'bg-blue-100 dark:bg-blue-800/30 border-blue-400 dark:border-blue-500' : ''}
                ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
              `}
            >
              <div className="text-sm font-medium mb-1">{date.getDate()}</div>
              
              {dayEvents.length > 0 && (
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                      className={`
                        text-xs p-1 rounded truncate cursor-pointer hover:opacity-80
                        ${getEventColor(event.type)}
                      `}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayEvents.length - 3} lagi
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekDays = getWeekData()
    
    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDate(date)
          
          return (
            <div key={index} className="min-h-[200px]">
              <div className="text-center mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday(date) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
              
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={`
                      text-xs p-2 rounded cursor-pointer hover:opacity-80
                      ${getEventColor(event.type)}
                    `}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    {showTime && event.startTime && (
                      <div className="text-xs opacity-75">
                        {formatTime(event.startTime)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate)
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatDate(currentDate)}
          </h4>
        </div>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Tidak ada acara untuk hari ini
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={`
                  p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
                  ${getEventColor(event.type)}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getEventIcon(event.type)({ className: 'h-5 w-5' })}
                      <h5 className="font-medium">{event.title}</h5>
                      {showStatus && event.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                          {getStatusLabel(event.status)}
                        </span>
                      )}
                      {event.priority && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(event.priority)}`}>
                          {getPriorityLabel(event.priority)}
                        </span>
                      )}
                    </div>
                    
                    {showEventDetails && event.description && (
                      <p className="text-sm mb-2">{event.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {showTime && event.startTime && event.endTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {showParticipants && event.participants && event.participants.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peserta:</div>
                        <div className="flex flex-wrap gap-1">
                          {event.participants.map((participant, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full"
                            >
                              {participant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCalendarContent = () => {
    switch (view) {
      case 'month':
        return renderMonthView()
      case 'week':
        return renderWeekView()
      case 'day':
        return renderDayView()
      default:
        return renderMonthView()
    }
  }

  return (
    <Card className={className}>
      <CardBody>
        {renderCalendarHeader()}
        {renderCalendarContent()}
      </CardBody>
    </Card>
  )
}

// Predefined calendar configurations
export const attendanceCalendarConfig = {
  title: 'Kalender Kehadiran',
  view: 'month' as const,
  showEventDetails: true,
  showStatus: true,
  showTime: true,
  showParticipants: false
}

export const leaveCalendarConfig = {
  title: 'Kalender Izin',
  view: 'month' as const,
  showEventDetails: true,
  showStatus: true,
  showTime: false,
  showParticipants: false
}

export const taskCalendarConfig = {
  title: 'Kalender Tugas',
  view: 'week' as const,
  showEventDetails: true,
  showStatus: true,
  showTime: true,
  showParticipants: true
}

export const wfhCalendarConfig = {
  title: 'Kalender WFH',
  view: 'month' as const,
  showEventDetails: true,
  showStatus: true,
  showTime: false,
  showParticipants: false
}

// Helper function to generate sample calendar events
export const generateSampleEvents = (): CalendarEvent[] => {
  const today = new Date()
  const events: CalendarEvent[] = []
  
  // Add some sample events for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Add attendance events
    if (i % 7 !== 0) { // Skip Sundays
      events.push({
        id: `attendance-${i}`,
        title: 'Absensi',
        date: dateStr,
        type: 'attendance',
        status: 'present',
        startTime: '08:00:00',
        endTime: '17:00:00'
      })
    }
    
    // Add some leave requests
    if (i === 5 || i === 15) {
      events.push({
        id: `leave-${i}`,
        title: 'Izin Sakit',
        date: dateStr,
        type: 'leave',
        status: 'approved',
        description: 'Izin sakit karena demam'
      })
    }
    
    // Add some WFH logs
    if (i === 10 || i === 20) {
      events.push({
        id: `wfh-${i}`,
        title: 'Work From Home',
        date: dateStr,
        type: 'wfh',
        status: 'approved',
        description: 'WFH karena kondisi cuaca'
      })
    }
    
    // Add some tasks
    if (i % 3 === 0) {
      events.push({
        id: `task-${i}`,
        title: 'Review Dokumen',
        date: dateStr,
        type: 'task',
        status: 'pending',
        description: 'Review dokumen laporan bulanan',
        startTime: '09:00:00',
        endTime: '11:00:00',
        participants: ['John Doe', 'Jane Smith'],
        priority: 'medium'
      })
    }
  }
  
  return events
}
