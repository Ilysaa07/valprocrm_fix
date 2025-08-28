'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'
import { 
  Search, 
  Filter, 
  Plus, 
  Grid3X3, 
  List, 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin,
  Building,
  User,
  Calendar,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  FolderKanban,
  Users,
  FileText,
  Instagram
} from 'lucide-react'
import ContactModal from '@/components/contacts/ContactModal'
import ImportModal from '@/components/contacts/ImportModal'

type Contact = {
  id: string
  fullName: string
  phoneNumber?: string
  whatsappNumber?: string
  instagram?: string
  address?: string
  companyName?: string
  position?: string
  notes?: string
  clientStatus: 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  serviceType?: string
  followUpDate?: string
  createdAt: string
  updatedAt: string
  createdBy: { id: string; fullName: string; email: string }
  updatedBy?: { id: string; fullName: string; email: string }
  _count: { activityLogs: number }
}

export default function AdminContactsPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [savingContact, setSavingContact] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) redirect('/auth/signin')
    if (session.user.role !== 'ADMIN') redirect('/employee')
    loadContacts()
  }, [session, status, search, filterCompany, filterStatus, filterServiceType, pagination.page])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (search) params.append('search', search)
      if (filterCompany) params.append('company', filterCompany)
      if (filterStatus) params.append('status', filterStatus)
      if (filterServiceType) params.append('serviceType', filterServiceType)

      const res = await fetch(`/api/contacts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts)
        setPagination(data.pagination)
      } else {
        showToast('Gagal memuat kontak', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContact = async (contactData: any) => {
    try {
      setSavingContact(true)
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts'
      const method = editingContact ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })

      if (res.ok) {
        showToast(
          editingContact ? 'Kontak berhasil diperbarui' : 'Kontak berhasil ditambahkan',
          { type: 'success' }
        )
        setShowCreateModal(false)
        setEditingContact(null)
        loadContacts()
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal menyimpan kontak', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    } finally {
      setSavingContact(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kontak ini?')) return

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Kontak berhasil dihapus', { type: 'success' })
        loadContacts()
      } else {
        showToast('Gagal menghapus kontak', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    }
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({ format })
      if (search) params.append('search', search)
      if (filterCompany) params.append('company', filterCompany)
      if (filterStatus) params.append('status', filterStatus)
      if (filterServiceType) params.append('serviceType', filterServiceType)

      const res = await fetch(`/api/contacts/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contacts-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Data berhasil diekspor', { type: 'success' })
      } else {
        showToast('Gagal mengekspor data', { type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan', { type: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROSPECT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PROSPECT': return 'Prospek'
      case 'ACTIVE': return 'Aktif'
      case 'INACTIVE': return 'Tidak Aktif'
      case 'COMPLETED': return 'Selesai'
      default: return status
    }
  }

  const openQuickAction = (type: 'phone' | 'whatsapp' | 'instagram' | 'maps', value: string) => {
    let url = ''
    switch (type) {
      case 'phone':
        url = `tel:${value}`
        break
      case 'whatsapp':
        url = `https://wa.me/${value.replace(/[^0-9]/g, '')}`
        break
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`
        break
      case 'maps':
        url = `https://maps.google.com/?q=${encodeURIComponent(value)}`
        break
    }
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Manajemen Kontak
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Kelola kontak klien dan prospek bisnis
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {viewMode === 'grid' ? (
                <>
                  <List className="w-4 h-4" />
                  List
                </>
              ) : (
                <>
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Kontak
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Kontak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Prospek</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contacts.filter(c => c.clientStatus === 'PROSPECT').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Building className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Klien Aktif</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contacts.filter(c => c.clientStatus === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Follow Up</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contacts.filter(c => c.followUpDate && new Date(c.followUpDate) <= new Date()).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                placeholder="Cari kontak..."
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Filter perusahaan"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
              />
              <select
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="PROSPECT">Prospek</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Tidak Aktif</option>
                <option value="COMPLETED">Selesai</option>
              </select>
              <input
                placeholder="Filter layanan"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={filterServiceType}
                onChange={e => setFilterServiceType(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Contacts Display */}
        {loading ? (
          <Card className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Memuat kontak...</p>
            </div>
          </Card>
        ) : contacts.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada kontak</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Mulai tambahkan kontak klien dan prospek bisnis Anda
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kontak Pertama
              </Button>
            </div>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {contacts.map((contact) => (
              viewMode === 'grid' ? (
                <Card key={contact.id} className="p-4 hover:shadow-lg transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{contact.fullName}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.clientStatus)}`}>
                          {getStatusLabel(contact.clientStatus)}
                        </span>
                        {contact.followUpDate && new Date(contact.followUpDate) <= new Date() && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Follow Up!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {contact.companyName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <Building className="w-4 h-4" />
                      <span>{contact.companyName}</span>
                      {contact.position && <span>• {contact.position}</span>}
                    </div>
                  )}

                  {contact.serviceType && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                      <FileText className="w-4 h-4" />
                      <span>{contact.serviceType}</span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-1 mb-3">
                    {contact.phoneNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuickAction('phone', contact.phoneNumber!)}
                        className="flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </Button>
                    )}
                    {contact.whatsappNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuickAction('whatsapp', contact.whatsappNumber!)}
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/admin/projects?contactId=${contact.id}`, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <FolderKanban className="w-3 h-3" />
                      Projects
                    </Button>
                    {contact.address && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(contact.id, 'maps')}
                        className="flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Maps
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {contact.createdBy.fullName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(contact.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingContact(contact)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card key={contact.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{contact.fullName}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.clientStatus)}`}>
                          {getStatusLabel(contact.clientStatus)}
                        </span>
                        {contact.followUpDate && new Date(contact.followUpDate) <= new Date() && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Follow Up!</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        {contact.companyName && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {contact.companyName}
                          </span>
                        )}
                        {contact.position && <span>• {contact.position}</span>}
                        {contact.serviceType && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {contact.serviceType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {contact.phoneNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQuickAction('phone', contact.phoneNumber!)}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      )}
                      {contact.whatsappNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQuickAction('whatsapp', contact.whatsappNumber!)}
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      )}
                      {contact.instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQuickAction('instagram', contact.instagram!)}
                        >
                          <Instagram className="w-3 h-3" />
                        </Button>
                      )}
                      {contact.address && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQuickAction('maps', contact.address!)}
                        >
                          <MapPin className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}

        {/* Contact Modal */}
        <ContactModal
          isOpen={showCreateModal || !!editingContact}
          onClose={() => {
            setShowCreateModal(false)
            setEditingContact(null)
          }}
          onSave={handleSaveContact}
          contact={editingContact}
          loading={savingContact}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            loadContacts()
            setShowImportModal(false)
          }}
        />
      </div>
    </AdminLayout>
  )
}
