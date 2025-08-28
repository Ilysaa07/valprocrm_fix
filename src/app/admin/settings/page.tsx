"use client"

import AdminLayout from '@/components/layout/AdminLayout'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { Sun, Moon, User, Camera, KeyRound } from 'lucide-react'

interface Profile {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  avatar?: string | null
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [ewalletNumber, setEwalletNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { theme, toggle } = useTheme()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [changeMsg, setChangeMsg] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/user/profile', { cache: 'no-store' })
        if (!res.ok) throw new Error('Gagal memuat profil')
        const j = await res.json()
        const data: Profile = j.data
        if (!isMounted) return
        setProfile(data)
        setFullName(data.name || '')
        setPhoneNumber(data.phone || '')
        setAddress(data.address || '')
      } catch (e: any) {
        if (!isMounted) return
        setError(e?.message || 'Gagal memuat profil')
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          address: address || undefined,
          phone: phoneNumber || undefined,
        })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Gagal menyimpan profil')
      }
      const j = await res.json()
      const updated: Profile = j.data
      setProfile(updated)
      setSuccess('Profil berhasil disimpan')
    } catch (e: any) {
      setError(e?.message || 'Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpload(file: File) {
    setIsUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/upload-photo', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Upload gagal')
      setProfile(p => p ? { ...p, avatar: j.profilePicture || (j.user?.profilePicture ?? p.avatar) } : p)
      setSuccess('Foto profil berhasil diupload')
    } catch (e: any) {
      setError(e?.message || 'Upload gagal')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsChanging(true)
    setChangeMsg(null)
    try {
      if (!newPassword || newPassword !== confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok')
      }
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword, confirmPassword })
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Gagal mengubah password')
      setChangeMsg('Password berhasil diubah')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setChangeMsg(e?.message || 'Terjadi kesalahan')
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Pengaturan Sistem</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Kelola profil dan preferensi sistem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Camera className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Foto Profil</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Upload foto profil Anda</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={profile?.profilePicture || '/valprologo.webp'}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-neutral-200 dark:border-neutral-700 shadow-md"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="w-full">
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files && e.target.files[0] && handleUpload(e.target.files[0])}
                  disabled={isUploading}
                  className="w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">JPG, PNG, atau WEBP. Maks 5MB.</p>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <Sun className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tema</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Kustomisasi tampilan aplikasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Mode Tema</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => theme !== 'light' && toggle()}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Sun className="w-4 h-4 mr-2 inline" />
                    Terang
                  </button>
                  <button
                    onClick={() => theme !== 'dark' && toggle()}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Moon className="w-4 h-4 mr-2 inline" />
                    Gelap
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <form onSubmit={handleSave} className="lg:col-span-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-info-100 dark:bg-info-900/30 rounded-lg">
                <User className="w-6 h-6 text-info-600 dark:text-info-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Detail Profil</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Informasi pribadi Anda</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-lg">
                <p className="text-danger-700 dark:text-danger-300 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-secondary-50 dark:bg-secondary-900/30 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                <p className="text-secondary-700 dark:text-secondary-300 text-sm">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nama Lengkap</label>
                <input 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email</label>
                <input 
                  value={profile?.email || ''} 
                  disabled 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nomor Telepon</label>
                <input 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Alamat</label>
                <input 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Jenis Kelamin</label>
                <select 
                  value={gender} 
                  onChange={e => setGender(e.target.value as any)} 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">Pilih</option>
                  <option value="MALE">Laki-laki</option>
                  <option value="FEMALE">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">No. Rekening Bank</label>
                <input 
                  value={bankAccountNumber} 
                  onChange={e => setBankAccountNumber(e.target.value)} 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">No. E-Wallet</label>
                <input 
                  value={ewalletNumber} 
                  onChange={e => setEwalletNumber(e.target.value)} 
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" 
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSaving} 
                className="px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 transition-colors duration-200 font-medium"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="lg:col-span-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                <KeyRound className="w-6 h-6 text-warning-700 dark:text-warning-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Ubah Password</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Pastikan password kuat dan unik</p>
              </div>
            </div>
            {changeMsg && (
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm">{changeMsg}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Password Lama</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Password Baru</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Konfirmasi Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={isChanging} className="px-6 py-3 rounded-lg bg-warning-600 text-white hover:bg-warning-700 disabled:opacity-60 transition-colors duration-200 font-medium">
                {isChanging ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}


