'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useUpdateSession } from '@/hooks/useUpdateSession'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

interface User {
  id: string
  email: string
  fullName: string
  address: string
  gender: 'MALE' | 'FEMALE'
  nikKtp: string
  phoneNumber: string
  bankAccountNumber?: string
  ewalletNumber?: string
  profilePicture?: string
  role: 'ADMIN' | 'EMPLOYEE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { updateSession } = useUpdateSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    address: '',
    phoneNumber: '',
    bankAccountNumber: '',
    ewalletNumber: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchProfile()
    }
  }, [status, router, session])

  const fetchProfile = async () => {
    try {
      if (!session?.user?.id) {
        setError('Sesi pengguna tidak tersedia')
        setLoading(false)
        return
      }
      
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setProfileForm({
          fullName: data.user.fullName || '',
          address: data.user.address || '',
          phoneNumber: data.user.phoneNumber || '',
          bankAccountNumber: data.user.bankAccountNumber || '',
          ewalletNumber: data.user.ewalletNumber || '',
        })
      } else {
        setError('Gagal memuat profil')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Terjadi kesalahan saat memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setMessage('Profil berhasil diperbarui')
      } else {
        setError(data.error || 'Gagal memperbarui profil')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memperbarui profil')
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password berhasil diubah')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setShowPasswordForm(false)
      } else {
        setError(data.error || 'Gagal mengubah password')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengubah password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setMessage('')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setMessage('Foto profil berhasil diupload')
        
        // Update session untuk memperbarui foto profil di sidebar
        await updateSession({
          user: {
            image: data.profilePicture
          }
        })
        
        // Refresh halaman untuk memperbarui tampilan
        router.refresh()
      } else {
        setError(data.error || 'Gagal mengupload foto profil')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengupload foto profil')
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Gagal memuat profil pengguna</div>
      </div>
    )
  }

  return (
    <EmployeeLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profil Saya</h1>

        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Foto Profil */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 shadow dark:shadow-dark rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Foto Profil</h2>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {user.fullName ? user.fullName.charAt(0) : 'U'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Pilih foto profil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  JPG, JPEG, PNG, atau WEBP. Maksimal 5MB.
                </p>
                {uploadingPhoto && (
                  <p className="mt-2 text-sm text-blue-600">Mengupload foto...</p>
                )}
              </div>
            </div>
          </div>

          {/* Informasi Profil */}
          <div className="bg-white dark:bg-neutral-900 shadow dark:shadow-dark rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Profil</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Nama Lengkap</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Alamat</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Nomor HP</label>
                <input
                  type="text"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Nomor Rekening Bank</label>
                <input
                  type="text"
                  value={profileForm.bankAccountNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Nomor E-Wallet</label>
                <input
                  type="text"
                  value={profileForm.ewalletNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, ewalletNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updating ? 'Memperbarui...' : 'Perbarui Profil'}
              </button>
            </form>
          </div>

          {/* Informasi Akun & Keamanan */}
          <div className="space-y-6">
            {/* Detail Akun */}
            <div className="bg-white dark:bg-neutral-900 shadow dark:shadow-dark rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detail Akun</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">NIK KTP:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-neutral-100">{user.nikKtp}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Jenis Kelamin:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-neutral-100">
                    {user.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Role:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-neutral-100">
                    {user.role === 'ADMIN' ? 'Administrator' : 'Karyawan'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Status:</span>
                  <span className={`ml-2 text-sm ${
                    user.status === 'APPROVED' ? 'text-green-600' :
                    user.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                  } dark:text-neutral-100`}>
                    {user.status === 'APPROVED' ? 'Disetujui' :
                     user.status === 'PENDING' ? 'Menunggu Persetujuan' : 'Ditolak'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Bergabung:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-neutral-100">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Keamanan */}
            <div className="bg-white dark:bg-neutral-900 shadow dark:shadow-dark rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Keamanan</h2>
              
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                >
                  Ubah Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Password Lama</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Password Baru</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {changingPassword ? 'Mengubah...' : 'Ubah Password'}
                  </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }}
                      className="flex-1 flex justify-center py-2 px-4 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </EmployeeLayout>
  )
}

