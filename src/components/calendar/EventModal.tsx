'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Trash2 } from 'lucide-react'
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
    fullName: string
    email: string
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
    }
  }>
  project?: {
    id: string
    name: string
  }
  contact?: {
    id: string
    fullName: string
  }
}

interface EventModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event?: CalendarEvent) => void
  onDelete: () => void
  isCreating: boolean
}

interface Project {
  id: string
  name: string
  status: string
}

interface Contact {
  id: string
  name: string
  email: string
  companyName?: string
}

export default function EventModal({ event, isOpen, onClose, onSave, onDelete, isCreating }: EventModalProps) {
  const { data: _session } = useSession()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    meetingLink: '',
    category: 'MEETING',
    priority: 'MEDIUM',
    status: 'CONFIRMED',
    visibility: 'PRIVATE',
    projectId: '',
    contactId: '',
    attendees: [] as Array<{
      userId?: string
      email?: string
      name?: string
      isOrganizer: boolean
    }>,
    reminders: [] as Array<{
      reminderTime: string
      reminderType: string
      message?: string
    }>
  })

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
      fetchContacts()
      
      if (event && !isCreating) {
        const startTime = new Date(event.startTime)
        const endTime = new Date(event.endTime)
        
        setFormData({
          title: event.title,
          description: event.description || '',
          startTime: startTime.toISOString().slice(0, 16),
          endTime: endTime.toISOString().slice(0, 16),
          allDay: event.allDay,
          location: event.location || '',
          meetingLink: event.meetingLink || '',
          category: event.category,
          priority: event.priority,
          status: event.status,
          visibility: event.visibility,
          projectId: event.project?.id || '',
          contactId: event.contact?.id || '',
          attendees: event.attendees.map(a => ({
            userId: a.userId,
            email: a.email,
            name: a.name,
            isOrganizer: a.isOrganizer
          })),
          reminders: []
        })
      } else {
        const now = new Date()
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
        
        setFormData({
          title: '',
          description: '',
          startTime: now.toISOString().slice(0, 16),
          endTime: oneHourLater.toISOString().slice(0, 16),
          allDay: false,
          location: '',
          meetingLink: '',
          category: 'MEETING',
          priority: 'MEDIUM',
          status: 'CONFIRMED',
          visibility: 'PRIVATE',
          projectId: '',
          contactId: '',
          attendees: [],
          reminders: [{
            reminderTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString().slice(0, 16),
            reminderType: 'NOTIFICATION',
            message: ''
          }]
        })
      }
    }
  }, [isOpen, event, isCreating])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      setProjects([])
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      setContacts([])
    }
  }

  interface EventPayload {
    title: string
    description?: string
    startTime: string
    endTime: string
    allDay: boolean
    location?: string
    meetingLink?: string
    category: 'MEETING' | 'DEADLINE' | 'REMINDER' | 'INTERNAL' | 'CLIENT' | 'PROJECT' | 'PERSONAL' | 'HOLIDAY'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
    visibility: 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL'
    projectId?: string
    contactId?: string
    attendees: Array<{ userId?: string; email?: string; name?: string; isOrganizer: boolean }>
    reminders: Array<{ reminderTime: string; reminderType: 'NOTIFICATION' | 'EMAIL' | 'SMS' | 'WHATSAPP'; message?: string }>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      showToast('Event title is required', { type: 'error' })
      return
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      showToast('End time must be after start time', { type: 'error' })
      return
    }

    setLoading(true)
    
    try {
      const url = isCreating ? '/api/calendar/events' : `/api/calendar/events/${event?.id}`
      const method = isCreating ? 'POST' : 'PUT'

      const payload: EventPayload = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        allDay: formData.allDay,
        location: formData.location || undefined,
        meetingLink: formData.meetingLink || undefined,
        category: formData.category as EventPayload['category'],
        priority: formData.priority as EventPayload['priority'],
        status: formData.status as EventPayload['status'],
        visibility: formData.visibility as EventPayload['visibility'],
        attendees: (formData.attendees || []).map(a => ({
          userId: a.userId || undefined,
          email: a.email || undefined,
          name: a.name || undefined,
          isOrganizer: !!a.isOrganizer
        })),
        reminders: (formData.reminders || []).map(r => ({
          reminderTime: new Date(r.reminderTime).toISOString(),
          reminderType: (r.reminderType || 'NOTIFICATION') as EventPayload['reminders'][number]['reminderType'],
          message: r.message || undefined
        }))
      }
      if (formData.projectId) payload.projectId = formData.projectId
      if (formData.contactId) payload.contactId = formData.contactId
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save event')
      }

      const result = await response.json()
      showToast(`Event ${isCreating ? 'created' : 'updated'} successfully`, { type: 'success' })
      onSave(result.event || result)
      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
      showToast(error instanceof Error ? error.message : 'Failed to save event', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || isCreating) return
    
    if (!confirm('Are you sure you want to delete this event?')) return

    setLoading(true)
    
    try {
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete event')
      }

      onDelete()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete event', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const addAttendee = () => {
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, { email: '', name: '', isOrganizer: false }]
    }))
  }

  const removeAttendee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }))
  }

  const updateAttendee = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map((attendee, i) => 
        i === index ? { ...attendee, [field]: value } : attendee
      )
    }))
  }

  const toggleAttendeeOrganizer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map((attendee, i) => 
        i === index ? { ...attendee, isOrganizer: !attendee.isOrganizer } : attendee
      )
    }))
  }

  const addReminder = () => {
    const now = new Date()
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, {
        reminderTime: now.toISOString().slice(0, 16),
        reminderType: 'NOTIFICATION',
        message: ''
      }]
    }))
  }

  const removeReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }))
  }

  const updateReminder = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) => 
        i === index ? { ...reminder, [field]: value } : reminder
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isCreating ? 'Create New Event' : 'Edit Event'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MEETING">Meeting</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="CLIENT">Client</option>
                  <option value="PROJECT">Project</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="HOLIDAY">Holiday</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event description"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All Day</span>
                </label>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meeting link"
                />
              </div>
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="TENTATIVE">Tentative</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                </select>
              </div>
            </div>

            {/* Project & Contact Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link to Project
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No project</option>
                  {projects?.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  )) || []}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link to Contact
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No contact</option>
                  {contacts?.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.companyName && `(${contact.companyName})`}
                    </option>
                  )) || []}
                </select>
              </div>
            </div>

            {/* Attendees */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Attendees
                </label>
                <button
                  type="button"
                  onClick={addAttendee}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Attendee
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.attendees.map((attendee, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={attendee.email || ''}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email address"
                    />
                    <input
                      type="text"
                      value={attendee.name || ''}
                      onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Name (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => toggleAttendeeOrganizer(index)}
                      className={`px-3 py-2 text-xs rounded-lg ${
                        attendee.isOrganizer
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Organizer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttendee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reminders
                </label>
                <button
                  type="button"
                  onClick={addReminder}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Reminder
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.reminders.map((reminder, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="datetime-local"
                      value={reminder.reminderTime}
                      onChange={(e) => updateReminder(index, 'reminderTime', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={reminder.reminderType}
                      onChange={(e) => updateReminder(index, 'reminderType', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NOTIFICATION">Notification</option>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                    <input
                      type="text"
                      value={reminder.message || ''}
                      onChange={(e) => updateReminder(index, 'message', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Message (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => removeReminder(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : isCreating ? 'Create Event' : 'Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
