'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Calendar, Clock, Plus, Filter, Users, MapPin } from 'lucide-react'
import CalendarView from '@/components/calendar/CalendarView'
import EventModal from '@/components/calendar/EventModal'
import { useToast } from '@/components/providers/ToastProvider'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay: boolean
  location?: string
  meetingLink?: string
  category: string
  priority: string
  status: string
  visibility: string
  createdBy: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  attendees: Array<{
    id: string
    userId?: string
    email?: string
    name?: string
    status: string
    isOrganizer: boolean
    user?: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
  project?: {
    id: string
    name: string
    status: string
  }
  contact?: {
    id: string
    name: string
    email: string
    companyName?: string
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    project: '',
    contact: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    
    fetchEvents()
  }, [session, status, currentDate, view, filters])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on current view
      const startDate = getViewStartDate()
      const endDate = getViewEndDate()
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      if (filters.category) params.append('category', filters.category)
      if (filters.project) params.append('projectId', filters.project)
      if (filters.contact) params.append('contactId', filters.contact)

      const response = await fetch(`/api/calendar/events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      showToast({
        title: 'Error',
        message: 'Failed to load calendar events',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getViewStartDate = () => {
    const date = new Date(currentDate)
    switch (view) {
      case 'month':
        date.setDate(1)
        date.setDate(date.getDate() - date.getDay())
        break
      case 'week':
        date.setDate(date.getDate() - date.getDay())
        break
      case 'day':
        break
    }
    date.setHours(0, 0, 0, 0)
    return date
  }

  const getViewEndDate = () => {
    const date = new Date(currentDate)
    switch (view) {
      case 'month':
        date.setMonth(date.getMonth() + 1, 0)
        date.setDate(date.getDate() + (6 - date.getDay()))
        break
      case 'week':
        date.setDate(date.getDate() - date.getDay() + 6)
        break
      case 'day':
        break
    }
    date.setHours(23, 59, 59, 999)
    return date
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setIsCreating(true)
    setIsEventModalOpen(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsCreating(false)
    setIsEventModalOpen(true)
  }

  const handleEventSaved = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setIsCreating(false)
    fetchEvents()
    showToast({
      title: 'Success',
      message: isCreating ? 'Event created successfully' : 'Event updated successfully',
      type: 'success'
    })
  }

  const handleEventDeleted = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setIsCreating(false)
    fetchEvents()
    showToast({
      title: 'Success',
      message: 'Event deleted successfully',
      type: 'success'
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your events and schedule
            </p>
          </div>
        </div>
        
        <button
          onClick={handleCreateEvent}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric',
                ...(view === 'day' && { day: 'numeric' })
              })}
            </h2>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
                    view === viewType
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">Filters:</span>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="MEETING">Meeting</option>
            <option value="DEADLINE">Deadline</option>
            <option value="REMINDER">Reminder</option>
            <option value="INTERNAL">Internal</option>
            <option value="CLIENT">Client</option>
            <option value="PROJECT">Project</option>
            <option value="PERSONAL">Personal</option>
            <option value="HOLIDAY">Holiday</option>
          </select>

          {filters.category || filters.project || filters.contact ? (
            <button
              onClick={() => setFilters({ category: '', project: '', contact: '' })}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView
        view={view}
        currentDate={currentDate}
        events={events}
        onEventClick={handleEditEvent}
        onDateClick={(date) => {
          setCurrentDate(date)
          if (view !== 'day') setView('day')
        }}
        loading={loading}
      />

      {/* Event Modal */}
      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSave={handleEventSaved}
          onDelete={handleEventDeleted}
          isCreating={isCreating}
        />
      )}
    </div>
  )
}
