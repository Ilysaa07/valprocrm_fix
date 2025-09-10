'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Filter, 
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Pencil,
  Trash2,
  AlertTriangle,
  UserPlus,
  Lock,
  Wallet
} from 'lucide-react'

interface User {
  id: string
  email: string
  fullName: string | null
  address: string | null
  gender: 'MALE' | 'FEMALE' | null
  nikKtp: string | null
  phoneNumber: string | null
  profilePicture?: string | null
  bankAccountNumber?: string | null
  ewalletNumber?: string | null
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

function UsersPageInner() {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    gender: '',
    nikKtp: '',
    phoneNumber: '',
    bankAccountNumber: '',
    ewalletNumber: '',
    status: ''
  })
  const [addUserData, setAddUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    address: '',
    gender: '',
    nikKtp: '',
    phoneNumber: '',
    bankAccountNumber: '',
    ewalletNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        // Accept both { users: [...] } and { data: [...] } response shapes
        const usersArray = Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.data)
            ? data.data
            : []
        setUsers(usersArray)
      } else {
        console.error('Error fetching users:', data.error)
      }
    } catch (_error) {
      console.error('Error fetching users:', _error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleApproveReject = async (userId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh users list
        fetchUsers()
        setSelectedUser(null)
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleOpenEditModal = (user: User) => {
    setUserToEdit(user)
    setFormData({
      fullName: user.fullName || '',
      address: user.address || '',
      gender: user.gender || '',
      nikKtp: user.nikKtp || '',
      phoneNumber: user.phoneNumber || '',
      bankAccountNumber: user.bankAccountNumber || '',
      ewalletNumber: user.ewalletNumber || '',
      status: user.status || ''
    })
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setUserToEdit(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        handleCloseEditModal()
        alert(data.message)
      } else {
        alert(data.error || 'Gagal mengupdate data karyawan')
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const handleOpenAddModal = () => {
    setAddUserData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      address: '',
      gender: '',
      nikKtp: '',
      phoneNumber: '',
      bankAccountNumber: '',
      ewalletNumber: ''
    })
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddUserData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi password
    if (addUserData.password !== addUserData.confirmPassword) {
      alert('Password dan konfirmasi password tidak sama')
      return
    }

    if (addUserData.password.length < 6) {
      alert('Password minimal 6 karakter')
      return
    }

    // Validasi nama lengkap
    if (addUserData.fullName.length < 2) {
      alert('Nama lengkap minimal 2 karakter')
      return
    }


    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addUserData.email)) {
      alert('Format email tidak valid')
      return
    }

    // Validasi alamat
    if (addUserData.address.length < 5) {
      alert('Alamat minimal 5 karakter')
      return
    }

    // Validasi NIK KTP
    if (addUserData.nikKtp.length !== 16) {
      alert('NIK KTP harus 16 digit')
      return
    }

    // Validasi NIK KTP hanya berisi angka
    if (!/^\d+$/.test(addUserData.nikKtp)) {
      alert('NIK KTP hanya boleh berisi angka')
      return
    }

    // Validasi nomor telepon
    if (addUserData.phoneNumber.length < 10) {
      alert('Nomor HP minimal 10 digit')
      return
    }

    // Validasi nomor telepon hanya berisi angka
    if (!/^\d+$/.test(addUserData.phoneNumber)) {
      alert('Nomor HP hanya boleh berisi angka')
      return
    }

    // Validasi informasi pembayaran
    if (!addUserData.bankAccountNumber && !addUserData.ewalletNumber) {
      alert('Harus mengisi nomor rekening bank atau e-wallet')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addUserData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        handleCloseAddModal()
        alert(data.message || 'Karyawan berhasil ditambahkan')
      } else {
        if (data.details && Array.isArray(data.details)) {
          // Menampilkan detail error validasi dari Zod
          const errorMessages = data.details.map((err: { path: string[]; message: string }) => `${err.path.join('.')}: ${err.message}`).join('\n')
          alert(`Validasi gagal:\n${errorMessages}`)
        } else {
          alert(data.error || 'Gagal menambahkan karyawan')
        }
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        handleCloseDeleteModal()
        alert(data.message)
      } else {
        alert(data.error || 'Gagal menghapus karyawan')
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(user =>
    (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      PENDING: 'Menunggu',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Karyawan</h1>
            <button
              onClick={handleOpenAddModal}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Tambah Karyawan
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-border bg-card text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-text-secondary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-border bg-card text-text-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-transparent transition-colors duration-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu Persetujuan</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-card rounded-lg shadow-soft transition-colors duration-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Karyawan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Kontak & NIK
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tanggal Daftar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-card-hover transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.fullName || 'User'}
                                className="h-10 w-10 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                                <User className="h-5 w-5 text-accent" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-text-primary">{user.fullName || 'N/A'}</div>
                            <div className="text-sm text-text-secondary">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">{user.phoneNumber || 'N/A'}</div>
                        <div className="text-sm text-text-secondary">{user.nikKtp || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/users/${user.id}`)
                              const data = await res.json()
                              if (res.ok && data?.user) {
                                setSelectedUser(data.user)
                              } else {
                                setSelectedUser(user)
                              }
                            } catch {
                              setSelectedUser(user)
                            }
                          }}
                          className="text-accent hover:text-accent-hover"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {user.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveReject(user.id, 'APPROVED')}
                              className="text-success hover:text-success-dark"
                              title="Setujui"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApproveReject(user.id, 'REJECTED')}
                              className="text-error hover:text-error-dark"
                              title="Tolak"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/users/${user.id}`)
                              const data = await res.json()
                              if (res.ok && data?.user) {
                                handleOpenEditModal(data.user)
                              } else {
                                handleOpenEditModal(user)
                              }
                            } catch {
                              handleOpenEditModal(user)
                            }
                          }}
                          className="text-warning hover:text-warning-dark"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          className="text-error hover:text-error-dark"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-text-muted" />
                  <h3 className="mt-2 text-sm font-medium text-text-primary">Tidak ada karyawan</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {searchTerm ? 'Tidak ada karyawan yang sesuai dengan pencarian.' : 'Belum ada karyawan yang terdaftar.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-text-primary/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-text-primary">Detail Karyawan</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-text-muted hover:text-text-secondary"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {selectedUser.profilePicture ? (
                    <img
                      src={selectedUser.profilePicture || ''}
                      alt={selectedUser.fullName || 'User'}
                      className="h-16 w-16 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-accent" />
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-text-primary">{selectedUser.fullName}</p>
                    <p className="text-sm text-text-secondary">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <User className="inline w-4 h-4 mr-1" />
                      Nama Lengkap
                    </label>
                    <p className="text-sm text-text-primary">{selectedUser.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email
                    </label>
                    <p className="text-sm text-text-primary">{selectedUser.email}</p>
                  </div>
                </div>
                
                {selectedUser.role !== 'ADMIN' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        Alamat
                      </label>
                      <p className="text-sm text-gray-900">{selectedUser.address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Jenis Kelamin</label>
                      <p className="text-sm text-text-primary">
                        {selectedUser.gender === 'MALE' ? 'Laki-laki' : selectedUser.gender === 'FEMALE' ? 'Perempuan' : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">NIK KTP</label>
                        <p className="text-sm text-text-primary">{selectedUser.nikKtp || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          <Phone className="inline w-4 h-4 mr-1" />
                          Nomor HP
                        </label>
                        <p className="text-sm text-text-primary">{selectedUser.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.bankAccountNumber && (
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            <CreditCard className="inline w-4 h-4 mr-1" />
                            Rekening Bank
                          </label>
                          <p className="text-sm text-text-primary">{selectedUser.bankAccountNumber}</p>
                        </div>
                      )}
                      {selectedUser.ewalletNumber && (
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">E-Wallet</label>
                          <p className="text-sm text-text-primary">{selectedUser.ewalletNumber}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>
              
              {selectedUser.status === 'PENDING' && (
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => handleApproveReject(selectedUser.id, 'APPROVED')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleApproveReject(selectedUser.id, 'REJECTED')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Tolak
                  </button>
                </div>
              )}
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    handleOpenEditModal(selectedUser)
                  }}
                  className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    handleOpenDeleteModal(selectedUser)
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {isEditModalOpen && userToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Karyawan</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {userToEdit?.role !== 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
                
                {userToEdit?.role !== 'ADMIN' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="MALE">Laki-laki</option>
                        <option value="FEMALE">Perempuan</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          NIK KTP
                        </label>
                        <input
                          type="text"
                          name="nikKtp"
                          value={formData.nikKtp}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Nomor HP
                        </label>
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {userToEdit?.role !== 'ADMIN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Rekening Bank
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        E-Wallet
                      </label>
                      <input
                        type="text"
                        name="ewalletNumber"
                        value={formData.ewalletNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="PENDING">Menunggu</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="REJECTED">Ditolak</option>
                  </select>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Hapus Karyawan</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus karyawan <strong>{userToDelete.fullName}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="mt-6 flex space-x-3 px-4">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tambah Karyawan Baru</h3>
                <button
                  onClick={handleCloseAddModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <User className="inline w-4 h-4 mr-1" />
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={addUserData.fullName}
                      onChange={handleAddInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={addUserData.email}
                      onChange={handleAddInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Alamat Lengkap *
                  </label>
                  <textarea
                    name="address"
                    value={addUserData.address}
                    onChange={handleAddInputChange}
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      name="gender"
                      value={addUserData.gender}
                      onChange={handleAddInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      NIK KTP *
                    </label>
                    <input
                      type="text"
                      name="nikKtp"
                      value={addUserData.nikKtp}
                      onChange={handleAddInputChange}
                      required
                      maxLength={16}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="16 digit NIK KTP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Nomor HP *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={addUserData.phoneNumber}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                {/* Payment Information */}
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Informasi Pembayaran Gaji</h3>
                  <p className="text-sm text-gray-600 mb-2">Pilih salah satu metode pembayaran gaji (minimal satu harus diisi)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        <CreditCard className="inline w-4 h-4 mr-1" />
                        Nomor Rekening Bank
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={addUserData.bankAccountNumber}
                        onChange={handleAddInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nomor rekening bank"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        <Wallet className="inline w-4 h-4 mr-1" />
                        Nomor E-Wallet
                      </label>
                      <input
                        type="text"
                        name="ewalletNumber"
                        value={addUserData.ewalletNumber}
                        onChange={handleAddInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nomor e-wallet (OVO, GoPay, dll)"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <Lock className="inline w-4 h-4 mr-1" />
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={addUserData.password}
                        onChange={handleAddInputChange}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <Lock className="inline w-4 h-4 mr-1" />
                      Konfirmasi Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={addUserData.confirmPassword}
                        onChange={handleAddInputChange}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ulangi password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Tambah Karyawan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <UsersPageInner />
    </Suspense>
  )
}

