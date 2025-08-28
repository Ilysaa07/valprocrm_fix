'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  allDay: boolean
  location?: string
  category: string
  priority: string
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
  }
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

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayEvents()
  }, [])

  const fetchTodayEvents = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      const params = new URLSearchParams({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      })

      const response = await fetch(`/api/calendar/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.slice(0, 5)) // Show only first 5 events
      }
    } catch (error) {
      console.error('Error fetching today events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day'
    
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    return `${start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Schedule</h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Schedule</h3>
        <Link
          href="/admin/calendar"
          className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No events scheduled for today</p>
          <Link
            href="/admin/calendar"
            className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schedule an event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className={`
                w-3 h-3 rounded-full mt-2 flex-shrink-0
                ${categoryColors[event.category as keyof typeof categoryColors]}
              `} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                    
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatEventTime(event)}
                    </div>

                    {event.location && (
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {event.attendees.length > 0 && (
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users className="h-3 w-3 mr-1" />
                        {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    {(event.project || event.contact) && (
                      <div className="mt-1">
                        {event.project && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded mr-1">
                            📂 {event.project.name}
                          </span>
                        )}
                        {event.contact && (
                          <span className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            👤 {event.contact.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {event.priority === 'URGENT' && (
                    <div className="flex-shrink-0">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {events.length === 5 && (
            <div className="text-center pt-2">
              <Link
                href="/admin/calendar"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                View {events.length > 5 ? 'more' : 'all'} events →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
