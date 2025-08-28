'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import { Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay: boolean
  location?: string
  category: string
  priority: string
  status: string
  createdBy: {
    name: string
  }
  attendees: Array<{
    id: string
    name?: string
    user?: {
      name: string
    }
  }>
  project?: {
    name: string
  }
  contact?: {
    name: string
    companyName?: string
  }
}

interface CalendarViewProps {
  view: 'month' | 'week' | 'day'
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  loading: boolean
}

const categoryColors = {
  MEETING: 'bg-blue-500',
  DEADLINE: 'bg-red-500',
  REMINDER: 'bg-yellow-500',
  INTERNAL: 'bg-green-500',
  CLIENT: 'bg-purple-500',
  PROJECT: 'bg-indigo-500',
  PERSONAL: 'bg-pink-500',
  HOLIDAY: 'bg-orange-500'
}

const priorityBorders = {
  LOW: 'border-l-2 border-gray-400',
  MEDIUM: 'border-l-2 border-yellow-400',
  HIGH: 'border-l-2 border-orange-400',
  URGENT: 'border-l-2 border-red-500'
}

export default function CalendarView({ view, currentDate, events, onEventClick, onDateClick, loading }: CalendarViewProps) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      if (event.allDay) {
        return isSameDay(eventStart, date) || 
               (eventStart <= date && eventEnd >= date)
      }
      
      return isSameDay(eventStart, date)
    })
  }

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day'
    
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
  }

  const EventCard = ({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) => (
    <div
      key={event.id}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setHoveredEvent(event.id)}
      onMouseLeave={() => setHoveredEvent(null)}
      className={`
        relative cursor-pointer rounded-md p-2 mb-1 text-xs transition-all duration-200
        ${categoryColors[event.category as keyof typeof categoryColors]} text-white
        ${priorityBorders[event.priority as keyof typeof priorityBorders]}
        hover:shadow-md hover:scale-105 transform
        ${compact ? 'truncate' : ''}
        ${event.status === 'CANCELLED' ? 'opacity-60 line-through' : ''}
        ${event.status === 'TENTATIVE' ? 'opacity-80 border-dashed border-2' : ''}
      `}
    >
      <div className="font-medium truncate">{event.title}</div>
      {!compact && (
        <>
          <div className="flex items-center mt-1 text-xs opacity-90">
            <Clock className="h-3 w-3 mr-1" />
            {formatEventTime(event)}
          </div>
          {event.location && (
            <div className="flex items-center mt-1 text-xs opacity-90">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.attendees.length > 0 && (
            <div className="flex items-center mt-1 text-xs opacity-90">
              <Users className="h-3 w-3 mr-1" />
              {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
      
      {/* Tooltip */}
      {hoveredEvent === event.id && (
        <div className="absolute z-50 bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg min-w-64 max-w-80">
          <div className="font-semibold mb-2">{event.title}</div>
          {event.description && (
            <div className="mb-2 text-gray-300">{event.description}</div>
          )}
          <div className="space-y-1 text-xs">
            <div>📅 {formatEventTime(event)}</div>
            {event.location && <div>📍 {event.location}</div>}
            {event.project && <div>📂 {event.project.name}</div>}
            {event.contact && (
              <div>👤 {event.contact.name} {event.contact.companyName && `(${event.contact.companyName})`}</div>
            )}
            <div>👨‍💼 Created by {event.createdBy.name}</div>
          </div>
        </div>
      )}
    </div>
  )

  if (view === 'month') {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = 'd'
    const rows = []
    let days = []
    let day = startDate

    // Create calendar grid
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const dayEvents = getEventsForDate(day)
        
        days.push(
          <div
            key={day.toString()}
            className={`
              min-h-32 p-2 border border-gray-200 dark:border-gray-700 cursor-pointer
              hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
              ${!isSameMonth(day, monthStart) ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : 'bg-white dark:bg-gray-900'}
              ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className={`
              text-sm font-medium mb-2
              ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : ''}
            `}>
              {format(day, dateFormat)}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <EventCard key={event.id} event={event} compact />
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Week header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows}
        </div>
      </div>
    )
  }

  if (view === 'week') {
    const weekStart = startOfWeek(currentDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div className="p-4"></div>
          {weekDays.map(day => (
            <div
              key={day.toString()}
              className={`
                p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
              onClick={() => onDateClick(day)}
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format(day, 'EEE')}
              </div>
              <div className={`
                text-lg font-semibold mt-1
                ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}
              `}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-8 divide-x divide-gray-200 dark:divide-gray-700">
          {/* Time column */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {hours.map(hour => (
              <div key={hour} className="h-16 p-2 text-xs text-gray-500 dark:text-gray-400">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDate(day)
            return (
              <div key={day.toString()} className="divide-y divide-gray-200 dark:divide-gray-700">
                {hours.map(hour => (
                  <div key={hour} className="h-16 p-1 relative">
                    {dayEvents
                      .filter(event => {
                        const eventStart = new Date(event.startTime)
                        return eventStart.getHours() === hour
                      })
                      .map(event => (
                        <EventCard key={event.id} event={event} compact />
                      ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (view === 'day') {
    const dayEvents = getEventsForDate(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {hours.map(hour => {
              const hourEvents = dayEvents.filter(event => {
                if (event.allDay) return false
                const eventStart = new Date(event.startTime)
                return eventStart.getHours() === hour
              })

              return (
                <div key={hour} className="flex">
                  <div className="w-20 p-4 text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div className="flex-1 p-2 min-h-16">
                    {hourEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* All day events and summary */}
        <div className="space-y-6">
          {/* All day events */}
          {dayEvents.some(e => e.allDay) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">All Day</h4>
              <div className="space-y-2">
                {dayEvents
                  .filter(event => event.allDay)
                  .map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
              </div>
            </div>
          )}

          {/* Day summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Day Summary</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>📅 {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</div>
              {dayEvents.some(e => e.category === 'MEETING') && (
                <div>🤝 {dayEvents.filter(e => e.category === 'MEETING').length} meeting{dayEvents.filter(e => e.category === 'MEETING').length !== 1 ? 's' : ''}</div>
              )}
              {dayEvents.some(e => e.category === 'DEADLINE') && (
                <div>⏰ {dayEvents.filter(e => e.category === 'DEADLINE').length} deadline{dayEvents.filter(e => e.category === 'DEADLINE').length !== 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
