'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { showError, showSuccess, showConfirm } from '@/lib/swal'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Wallet,
  Search,
  Filter,
  UserPlus,
  Eye,
  Check,
  X,
  Pencil,
  Trash2,
  Lock,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'

// Types
interface UserData {
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface FormData {
  fullName: string
  email: string
  address: string
  gender: string
  nikKtp: string
  phoneNumber: string
  bankAccountNumber: string
  ewalletNumber: string
  password: string
  confirmPassword: string
  status?: string
}

interface FormErrors {
  [key: string]: string
}

// Enhanced Modal Component
const AddEmployeeModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  isLoading: boolean
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    address: '',
    gender: '',
    nikKtp: '',
    phoneNumber: '',
    bankAccountNumber: '',
    ewalletNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi'
      if (!formData.email.trim()) newErrors.email = 'Email wajib diisi'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format email tidak valid'
      if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi'
      if (!formData.gender) newErrors.gender = 'Jenis kelamin wajib dipilih'
      if (!formData.nikKtp.trim()) newErrors.nikKtp = 'NIK KTP wajib diisi'
      else if (!/^\d{16}$/.test(formData.nikKtp)) newErrors.nikKtp = 'NIK KTP harus 16 digit'
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Nomor HP wajib diisi'
      else if (!/^08\d{8,11}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Format nomor HP tidak valid'
    }
    
    if (step === 2) {
      if (!formData.bankAccountNumber.trim() && !formData.ewalletNumber.trim()) {
        newErrors.payment = 'Minimal satu metode pembayaran harus diisi'
      }
    }
    
    if (step === 3) {
      if (!formData.password) newErrors.password = 'Password wajib diisi'
      else if (formData.password.length < 6) newErrors.password = 'Password minimal 6 karakter'
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Konfirmasi password wajib diisi'
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Password tidak sama'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    if (validateStep(3)) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      address: '',
      gender: '',
      nikKtp: '',
      phoneNumber: '',
      bankAccountNumber: '',
      ewalletNumber: '',
      password: '',
      confirmPassword: ''
    })
    setErrors({})
    setCurrentStep(1)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Tambah Karyawan Baru</h2>
            <button className="modal-close" onClick={handleClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="modal-body">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep 
                        ? 'bg-user-primary text-white' 
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        step < currentStep ? 'bg-user-primary' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi Personal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label form-label-required">
                      <User className="inline w-4 h-4 mr-1" />
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                      value={formData.fullName}
                      onChange={e => handleInputChange('fullName', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                    {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="nama@email.com"
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Alamat Lengkap
                  </label>
                  <textarea
                    className={`form-input ${errors.address ? 'form-input-error' : ''}`}
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                  />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label form-label-required">
                      Jenis Kelamin
                    </label>
                    <select
                      className={`form-input ${errors.gender ? 'form-input-error' : ''}`}
                      value={formData.gender}
                      onChange={e => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                    {errors.gender && <span className="form-error">{errors.gender}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">
                      NIK KTP
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.nikKtp ? 'form-input-error' : ''}`}
                      value={formData.nikKtp}
                      onChange={e => handleInputChange('nikKtp', e.target.value)}
                      placeholder="16 digit NIK KTP"
                      maxLength={16}
                    />
                    {errors.nikKtp && <span className="form-error">{errors.nikKtp}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Nomor HP
                  </label>
                  <input
                    type="tel"
                    className={`form-input ${errors.phoneNumber ? 'form-input-error' : ''}`}
                    value={formData.phoneNumber}
                    onChange={e => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi Pembayaran Gaji
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Pilih minimal satu metode pembayaran gaji
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      <CreditCard className="inline w-4 h-4 mr-1" />
                      Nomor Rekening Bank
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.bankAccountNumber}
                      onChange={e => handleInputChange('bankAccountNumber', e.target.value)}
                      placeholder="Nomor rekening bank"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Wallet className="inline w-4 h-4 mr-1" />
                      Nomor E-Wallet
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.ewalletNumber}
                      onChange={e => handleInputChange('ewalletNumber', e.target.value)}
                      placeholder="Nomor e-wallet (OVO, GoPay, dll)"
                    />
                  </div>
                </div>
                
                {errors.payment && <span className="form-error">{errors.payment}</span>}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi Akun
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label form-label-required">
                      <Lock className="inline w-4 h-4 mr-1" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                        value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">
                      <Lock className="inline w-4 h-4 mr-1" />
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`form-input pr-10 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                        value={formData.confirmPassword}
                        onChange={e => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Ulangi password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="btn-secondary px-4 py-2 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Sebelumnya
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary px-4 py-2 rounded-lg"
                >
                  Batal
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary px-4 py-2 rounded-lg"
                  >
                    Lanjut
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Tambah Karyawan'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Status Badge Component
const StatusBadge = ({ status }: { status: UserData['status'] }) => {
  const statusConfig = {
    PENDING: { label: 'Menunggu', className: 'status-badge-pending' },
    APPROVED: { label: 'Disetujui', className: 'status-badge-approved' },
    REJECTED: { label: 'Ditolak', className: 'status-badge-rejected' }
  }

  const config = statusConfig[status]
  
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  )
}

// Main Enhanced User Management Component
export default function EnhancedUserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<FormData>>({})

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      console.log('API Response:', { response: response.status, data })
      
      if (response.ok) {
        // API mengembalikan { data: users } bukan { users }
        setUsers(data.data || [])
        console.log('Users loaded:', data.data?.length || 0)
      } else {
        console.error('Error fetching users:', data.error)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [users, searchTerm, statusFilter])

  const handleAddUser = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchUsers()
        setIsAddModalOpen(false)
        await showSuccess('Berhasil!', 'Karyawan berhasil ditambahkan!')
      } else {
        await showError('Error!', data.error || 'Gagal menambahkan karyawan')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      await showError('Error!', 'Terjadi kesalahan saat menambahkan karyawan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view user details
  const handleViewUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setSelectedUser(data.user)
        setIsDetailModalOpen(true)
      } else {
        await showError('Error!', data.error || 'Gagal mengambil detail user')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      await showError('Error!', 'Terjadi kesalahan saat mengambil detail user')
    }
  }

  // Handle edit user
  const handleEditUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserToEdit(data.user)
        setEditFormData({
          fullName: data.user.fullName || '',
          address: data.user.address || '',
          gender: data.user.gender || '',
          nikKtp: data.user.nikKtp || '',
          phoneNumber: data.user.phoneNumber || '',
          bankAccountNumber: data.user.bankAccountNumber || '',
          ewalletNumber: data.user.ewalletNumber || '',
          status: data.user.status || ''
        })
        setIsEditModalOpen(true)
      } else {
        await showError('Error!', data.error || 'Gagal mengambil data user')
      }
    } catch (error) {
      console.error('Error fetching user for edit:', error)
      await showError('Error!', 'Terjadi kesalahan saat mengambil data user')
    }
  }

  // Handle update user
  const handleUpdateUser = async () => {
    if (!userToEdit) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchUsers()
        setIsEditModalOpen(false)
        setUserToEdit(null)
        setEditFormData({})
        await showSuccess('Berhasil!', 'Data karyawan berhasil diperbarui!')
      } else {
        await showError('Error!', data.error || 'Gagal memperbarui data karyawan')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      await showError('Error!', 'Terjadi kesalahan saat memperbarui data karyawan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const result = await showConfirm(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus karyawan "${userToDelete.fullName}"?`,
        'Ya, Hapus',
        'Batal'
      )
      
      if (!result.isConfirmed) return

      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchUsers()
        setIsDeleteModalOpen(false)
        setUserToDelete(null)
        await showSuccess('Berhasil!', 'Karyawan berhasil dihapus!')
      } else {
        await showError('Error!', data.error || 'Gagal menghapus karyawan')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      await showError('Error!', 'Terjadi kesalahan saat menghapus karyawan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle approve/reject user
  const handleApproveReject = async (userId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const user = users.find(u => u.id === userId)
      const actionText = action === 'APPROVED' ? 'menyetujui' : 'menolak'
      const actionTextPast = action === 'APPROVED' ? 'disetujui' : 'ditolak'
      
      const result = await showConfirm(
        `Konfirmasi ${action === 'APPROVED' ? 'Persetujuan' : 'Penolakan'}`,
        `Apakah Anda yakin ingin ${actionText} karyawan "${user?.fullName || 'ini"'}?`,
        `Ya, ${action === 'APPROVED' ? 'Setujui' : 'Tolak'}`,
        'Batal'
      )
      
      if (!result.isConfirmed) return

      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchUsers()
        await showSuccess('Berhasil!', `Karyawan berhasil ${actionTextPast}!`)
      } else {
        await showError('Error!', data.error || `Gagal ${actionText} karyawan`)
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error)
      await showError('Error!', `Terjadi kesalahan saat ${action === 'APPROVED' ? 'menyetujui' : 'menolak'} karyawan`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kelola Karyawan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kelola data karyawan dan status registrasi
          </p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu Persetujuan</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-user-primary" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Kontak & NIK</th>
                  <th>Status</th>
                  <th>Tanggal Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {user.profilePicture ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image
                                src={user.profilePicture}
                                alt={user.fullName || 'User'}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-user-primary-light flex items-center justify-center border border-gray-200 dark:border-gray-700">
                              <User className="w-5 h-5 text-user-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.phoneNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.nikKtp || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleViewUser(user.id)}
                          className="action-button action-button-primary" 
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleApproveReject(user.id, 'APPROVED')}
                              className="action-button action-button-success" 
                              title="Setujui"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApproveReject(user.id, 'REJECTED')}
                              className="action-button action-button-error" 
                              title="Tolak"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleEditUser(user.id)}
                          className="action-button action-button-warning" 
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setUserToDelete(user)
                            setIsDeleteModalOpen(true)
                          }}
                          className="action-button action-button-error" 
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto w-12 h-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Tidak ada karyawan
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Tidak ada karyawan yang sesuai dengan pencarian.' : 'Belum ada karyawan yang terdaftar.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
        isLoading={isSubmitting}
      />

      {/* User Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Detail Karyawan</h2>
                <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      {selectedUser.profilePicture ? (
                        <Image
                          src={selectedUser.profilePicture}
                          alt={selectedUser.fullName || 'User'}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-user-primary-light flex items-center justify-center">
                          <User className="w-8 h-8 text-user-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedUser.fullName || 'N/A'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Email</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="form-label">Nomor HP</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">NIK KTP</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.nikKtp || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">Jenis Kelamin</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedUser.gender === 'MALE' ? 'Laki-laki' : selectedUser.gender === 'FEMALE' ? 'Perempuan' : 'N/A'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label">Alamat</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">Rekening Bank</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.bankAccountNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">E-Wallet</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.ewalletNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">Status</label>
                      <div className="mt-1">
                        <StatusBadge status={selectedUser.status} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Tanggal Daftar</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedUser.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && userToEdit && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Edit Karyawan</h2>
                <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label form-label-required">Nama Lengkap</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.fullName || ''}
                      onChange={e => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Alamat</label>
                    <textarea
                      className="form-input"
                      value={editFormData.address || ''}
                      onChange={e => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label form-label-required">Jenis Kelamin</label>
                      <select
                        className="form-input"
                        value={editFormData.gender || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="MALE">Laki-laki</option>
                        <option value="FEMALE">Perempuan</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label form-label-required">NIK KTP</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editFormData.nikKtp || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, nikKtp: e.target.value }))}
                        maxLength={16}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Nomor HP</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editFormData.phoneNumber || ''}
                      onChange={e => setEditFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Rekening Bank</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editFormData.bankAccountNumber || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">E-Wallet</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editFormData.ewalletNumber || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, ewalletNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Status</label>
                    <select
                      className="form-input"
                      value={editFormData.status || ''}
                      onChange={e => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="PENDING">Menunggu</option>
                      <option value="APPROVED">Disetujui</option>
                      <option value="REJECTED">Ditolak</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn-secondary px-4 py-2 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    disabled={isSubmitting}
                    className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-content max-w-md">
              <div className="modal-header">
                <h2 className="modal-title">Hapus Karyawan</h2>
                <button className="modal-close" onClick={() => setIsDeleteModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                    <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Konfirmasi Hapus
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Apakah Anda yakin ingin menghapus karyawan <strong>{userToDelete.fullName}</strong>? 
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={isSubmitting}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
