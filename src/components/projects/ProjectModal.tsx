'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/useToast'
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar,
  Users,
  Target,
  FileText,
  Building2
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  contactId: string
  serviceType: string
  startDate: string
  endDate: string
  status: string
  notes?: string
  members: Array<{
    id: string
    userId: string
    role?: string
    user: {
      id: string
      fullName: string
      email: string
      role: string
    }
  }>
  milestones: Array<{
    id: string
    name: string
    description?: string
    startDate: string
    endDate: string
    status: string
  }>
}

interface Contact {
  id: string
  fullName: string
  companyName?: string
  clientStatus: string
}

interface User {
  id: string
  fullName: string
  email: string
  role: string
}

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (projectData: any) => void
  project?: Project | null
  loading?: boolean
}

interface Milestone {
  title: string
  description: string
  dueDate: string
  status: string
}

export default function ProjectModal({ 
  isOpen, 
  onClose, 
  onSave, 
  project, 
  loading = false 
}: ProjectModalProps) {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [showContactForm, setShowContactForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactId: '',
    serviceType: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
    notes: '',
    memberIds: [] as string[]
  })

  const [contactForm, setContactForm] = useState({
    fullName: '',
    companyName: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchContacts()
      fetchUsers()
      
      if (project) {
        setFormData({
          name: project.name,
          description: project.description || '',
          contactId: project.contactId,
          serviceType: project.serviceType,
          startDate: new Date(project.startDate).toISOString().split('T')[0],
          endDate: new Date(project.endDate).toISOString().split('T')[0],
          status: project.status,
          notes: project.notes || '',
          memberIds: project.members.map(m => m.userId)
        })
        
        // Normalize milestones data to prevent controlled/uncontrolled input errors
        const normalizedMilestones = (project.milestones || []).map((m: any) => ({
          title: m.name || m.title || '',
          description: m.description || '',
          dueDate: m.dueDate || m.endDate || m.startDate ? new Date(m.dueDate || m.endDate || m.startDate).toISOString().split('T')[0] : '',
          status: m.status || 'PENDING'
        }))
        setMilestones(normalizedMilestones)
      } else {
        setFormData({
          name: '',
          description: '',
          contactId: '',
          serviceType: '',
          startDate: '',
          endDate: '',
          status: 'PLANNING',
          notes: '',
          memberIds: []
        })
        setMilestones([])
      }
    }
  }, [isOpen, project])

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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      setUsers([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast('Nama proyek wajib diisi', { type: 'error' })
      return
    }

    if (!formData.contactId) {
      showToast('Klien/Contact wajib dipilih', { type: 'error' })
      return
    }

    if (!formData.serviceType.trim()) {
      showToast('Jenis layanan wajib diisi', { type: 'error' })
      return
    }

    if (!formData.startDate || !formData.endDate) {
      showToast('Tanggal mulai dan selesai wajib diisi', { type: 'error' })
      return
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      showToast('Tanggal selesai harus setelah tanggal mulai', { type: 'error' })
      return
    }

    const projectData = {
      ...formData,
      milestones: milestones.filter(m => m.title.trim())
    }

    onSave(projectData)
  }

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: '',
      description: '',
      dueDate: '',
      status: 'PENDING'
    }])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    ))
  }

  const createContact = async () => {
    if (!contactForm.fullName.trim()) {
      showToast('Nama kontak wajib diisi', { type: 'error' })
      return
    }

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: contactForm.fullName.trim(),
          companyName: contactForm.companyName.trim() || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ ...prev, contactId: result.contact.id }))
        setContacts(prev => [...prev, result.contact])
        setShowContactForm(false)
        setContactForm({ fullName: '', companyName: '' })
        showToast('Kontak berhasil dibuat', { type: 'success' })
      } else {
        const error = await response.json()
        showToast(error.error || 'Gagal membuat kontak', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project ? 'Edit Proyek' : 'Buat Proyek Baru'}
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
                  Nama Proyek *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama proyek"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jenis Layanan *
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih jenis layanan</option>
                  <option value="web">Web Development</option>
                  <option value="mobile">Mobile App</option>
                  <option value="design">UI/UX Design</option>
                  <option value="consulting">Konsultasi</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan deskripsi proyek"
              />
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Klien/Contact *
              </label>
              <div className="flex items-center space-x-3">
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih klien</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.fullName} {contact.companyName && `(${contact.companyName})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Baru</span>
                </button>
              </div>
              
              {showContactForm && (
                <div className="mt-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={contactForm.fullName}
                      onChange={(e) => setContactForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nama lengkap"
                    />
                    <input
                      type="text"
                      value={contactForm.companyName}
                      onChange={(e) => setContactForm(prev => ({ ...prev, companyName: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nama perusahaan (opsional)"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      type="button"
                      onClick={createContact}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Buat Kontak
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
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
                  <option value="PLANNING">Perencanaan</option>
                  <option value="ONGOING">Sedang Berjalan</option>
                  <option value="ON_HOLD">Ditahan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anggota Tim
              </label>
              <select
                multiple
                value={formData.memberIds}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                  setFormData(prev => ({ ...prev, memberIds: selectedOptions }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size={5}
              >
                {users.filter(user => user.role === 'EMPLOYEE').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Tekan Ctrl (atau Cmd di Mac) untuk memilih beberapa anggota
              </p>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Milestones/Tonggak
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Milestone</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Milestone {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Judul milestone"
                      />
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={milestone.status}
                        onChange={(e) => updateMilestone(index, 'status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PENDING">Belum Dimulai</option>
                        <option value="IN_PROGRESS">Sedang Berjalan</option>
                        <option value="COMPLETED">Selesai</option>
                        <option value="OVERDUE">Terlambat</option>
                      </select>
                    </div>
                    
                    <textarea
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      className="w-full mt-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Deskripsi milestone (opsional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Catatan tambahan untuk proyek"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>{project ? 'Update' : 'Buat'} Proyek</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
