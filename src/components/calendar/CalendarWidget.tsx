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
  MEETING: 'bg-accent',
  DEADLINE: 'bg-error',
  REMINDER: 'bg-warning',
  INTERNAL: 'bg-success',
  CLIENT: 'bg-accent/80',
  PROJECT: 'bg-accent/60',
  PERSONAL: 'bg-accent/40',
  HOLIDAY: 'bg-warning/80'
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
      <div className="bg-card rounded-lg shadow-soft border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Today's Schedule</h3>
          <Calendar className="h-5 w-5 text-text-muted" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-surface rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-surface rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-soft border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Today's Schedule</h3>
        <Link
          href="/admin/calendar"
          className="flex items-center text-sm text-accent hover:text-accent-hover"
        >
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No events scheduled for today</p>
          <Link
            href="/admin/calendar"
            className="inline-flex items-center mt-2 text-sm text-accent hover:text-accent-hover"
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
              className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-colors"
            >
              <div className={`
                w-3 h-3 rounded-full mt-2 flex-shrink-0
                ${categoryColors[event.category as keyof typeof categoryColors]}
              `} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text-primary truncate">
                      {event.title}
                    </h4>
                    
                    <div className="flex items-center mt-1 text-xs text-text-secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatEventTime(event)}
                    </div>

                    {event.location && (
                      <div className="flex items-center mt-1 text-xs text-text-secondary">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {event.attendees.length > 0 && (
                      <div className="flex items-center mt-1 text-xs text-text-secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    {(event.project || event.contact) && (
                      <div className="mt-1">
                        {event.project && (
                          <span className="inline-block px-2 py-1 text-xs bg-accent/20 text-accent-dark rounded mr-1">
                            📂 {event.project.name}
                          </span>
                        )}
                        {event.contact && (
                          <span className="inline-block px-2 py-1 text-xs bg-success/20 text-success-dark rounded">
                            👤 {event.contact.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {event.priority === 'URGENT' && (
                    <div className="flex-shrink-0">
                      <span className="inline-block w-2 h-2 bg-error rounded-full animate-pulse"></span>
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
