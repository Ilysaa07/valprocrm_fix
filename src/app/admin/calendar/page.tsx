'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  Calendar, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Search,
  X,
  Clock3,
  CalendarDays,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'
import CalendarView from '@/components/calendar/CalendarView'
import EventModal from '@/components/calendar/EventModal'

interface CalendarEventApi {
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
    fullName: string
    email: string
    profilePicture?: string
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
      fullName: string
      email: string
      profilePicture?: string
    }
  }>
  project?: {
    id: string
    name: string
    status: string
  }
  contact?: {
    id: string
    fullName: string
    phoneNumber?: string
    companyName?: string
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [events, setEvents] = useState<CalendarEventApi[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventApi | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    project: '',
    contact: '',
    status: '',
    priority: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [quickStats, setQuickStats] = useState({
    totalEvents: 0,
    todayEvents: 0,
    upcomingEvents: 0,
    overdueEvents: 0
  })

  const getViewStartDate = useCallback(() => {
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
  }, [currentDate, view])

  const getViewEndDate = useCallback(() => {
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
  }, [currentDate, view])

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = getViewStartDate()
      const endDate = getViewEndDate()
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      if (filters.category) params.append('category', filters.category)
      if (filters.project) params.append('projectId', filters.project)
      if (filters.contact) params.append('contactId', filters.contact)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)

      const response = await fetch(`/api/calendar/events?${params}`)
      if (!response.ok) throw new Error('Gagal memuat event')
      
      const data = await response.json()
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }, [filters, getViewEndDate, getViewStartDate])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    fetchEvents()
  }, [session, status, fetchEvents])

  useEffect(() => {
    const today = new Date()
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === today.toDateString()
    }).length

    const upcomingEvents = events.filter(event => new Date(event.startTime) > today).length
    const overdueEvents = events.filter(event => new Date(event.startTime) < today && event.status !== 'COMPLETED').length

    setQuickStats({
      totalEvents: events.length,
      todayEvents,
      upcomingEvents,
      overdueEvents
    })
  }, [events])

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setIsCreating(true)
    setIsEventModalOpen(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event as unknown as CalendarEventApi)
    setIsCreating(false)
    setIsEventModalOpen(true)
  }

  const handleEventSaved = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setIsCreating(false)
    fetchEvents()
    showToast('Event berhasil disimpan', { type: 'success' })
  }

  const handleEventDeleted = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setIsCreating(false)
    fetchEvents()
    showToast('Event berhasil dihapus', { type: 'success' })
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

  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query)) ||
        event.createdBy.fullName.toLowerCase().includes(query)
      )
    }
    return true
  }) as unknown as import('@/components/calendar/CalendarView').CalendarEvent[]

  if (loading && events.length === 0) {
    return (
      <AdminLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#121212] min-h-screen transition-colors duration-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Kalender
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola jadwal dan event perusahaan</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button onClick={handleCreateEvent} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Event Baru
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Event</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.totalEvents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Clock3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.todayEvents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <CalendarDays className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Mendatang</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.upcomingEvents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Terlambat</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.overdueEvents}</p>
              </div>
            </div>
          </Card>
      </div>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                placeholder="Cari event, lokasi, atau peserta..."
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {showFilters && (
              <div className="flex gap-2 flex-wrap">
                <select
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Semua Kategori</option>
                  <option value="MEETING">Rapat</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="REMINDER">Pengingat</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="CLIENT">Klien</option>
                  <option value="PROJECT">Proyek</option>
                  <option value="PERSONAL">Pribadi</option>
                  <option value="HOLIDAY">Libur</option>
                </select>

                <select
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Semua Status</option>
                  <option value="CONFIRMED">Dikonfirmasi</option>
                  <option value="TENTATIVE">Sementara</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>

                <select
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="">Semua Prioritas</option>
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Mendesak</option>
                </select>

                {(filters.category || filters.status || filters.priority) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFilters({ category: '', project: '', contact: '', status: '', priority: '' })}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Hapus Filter
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')} className="p-2">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="px-3 py-1 text-sm">
                  Hari Ini
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')} className="p-2">
                  <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {view === 'day' 
                  ? `${currentDate.toLocaleDateString('id-ID', { weekday: 'long' })}, ${currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : `${currentDate.toLocaleDateString('id-ID', { month: 'long' })} ${currentDate.getFullYear()}`
                }
            </h2>
          </div>

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
        </Card>

      <CalendarView
        view={view}
        currentDate={currentDate}
          events={filteredEvents}
        onEventClick={handleEditEvent}
        onDateClick={(date) => {
          setCurrentDate(date)
          if (view !== 'day') setView('day')
        }}
      />

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
    </AdminLayout>
  )
}
