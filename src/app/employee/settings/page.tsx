"use client"

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { Bell, Palette, Globe, Sun, Moon, User, Camera, KeyRound } from 'lucide-react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useUpdateSession } from '@/hooks/useUpdateSession'

interface Profile {
  id: string
  fullName: string
  email: string
  phoneNumber?: string | null
  gender?: 'MALE' | 'FEMALE' | null
  address?: string | null
  nikKtp?: string | null
  bankAccountNumber?: string | null
  ewalletNumber?: string | null
  profilePicture?: string | null
}

export default function EmployeeSettings() {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const { updateSession } = useUpdateSession()

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

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [changeMsg, setChangeMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/user/profile', { cache: 'no-store' })
        if (!res.ok) throw new Error('Gagal memuat profil')
        const j = await res.json()
        const data: any = j.data
        if (!mounted) return
        setProfile({
          id: data.id,
          fullName: data.name || '',
          email: data.email || '',
          phoneNumber: data.phone || '',
          address: data.address || '',
          profilePicture: data.avatar || null
        })
        setFullName(data.name || '')
        setPhoneNumber(data.phone || '')
        setAddress(data.address || '')
        setGender('')
        setBankAccountNumber('')
        setEwalletNumber('')
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Gagal memuat profil')
      }
    })()
    return () => { mounted = false }
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
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Gagal menyimpan profil')
      setProfile(p => p ? { ...p, fullName, phoneNumber, address } : p)
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
      setProfile(p => p ? { ...p, profilePicture: j.profilePicture } : p)
      setSuccess('Foto profil berhasil diupload')
      
      // Update session to reflect new profile picture
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: j.profilePicture
        }
      })
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
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Pengaturan</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Kelola preferensi akun Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center border-4 border-neutral-200 dark:border-neutral-700 shadow-md">
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {profile?.fullName ? profile.fullName.charAt(0) : 'U'}
                  </span>
                )}
              </div>
              <div className="w-full">
                <input id="avatar" type="file" accept="image/*" onChange={e => e.target.files && e.target.files[0] && handleUpload(e.target.files[0])} disabled={isUploading} className="w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">JPG, PNG, atau WEBP. Maks 5MB.</p>
              </div>
            </div>
          </div>
          {/* Theme Settings */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Palette className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tema</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Kustomisasi tampilan aplikasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Mode Tema</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => theme !== 'light' && toggle()}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
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
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Ukuran Font</label>
                <select className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  <option value="small">Kecil</option>
                  <option value="medium">Sedang</option>
                  <option value="large">Besar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                <Globe className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Bahasa</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Pilih bahasa yang Anda inginkan</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Bahasa Aplikasi</label>
                <select className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Format Tanggal</label>
                <select className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                  <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <Bell className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Notifikasi</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Kelola notifikasi aplikasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Notifikasi Email</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Terima notifikasi melalui email</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-200 dark:bg-neutral-700 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Notifikasi Push</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Terima notifikasi real-time</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-500 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <form onSubmit={handleSave} className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-info-100 dark:bg-info-900/30 rounded-lg">
                <User className="w-6 h-6 text-info-600 dark:text-info-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Akun</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Informasi profil Anda</p>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-lg mb-4">
                <p className="text-danger-700 dark:text-danger-300 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-secondary-50 dark:bg-secondary-900/30 border border-secondary-200 dark:border-secondary-800 rounded-lg mb-4">
                <p className="text-secondary-700 dark:text-secondary-300 text-sm">{success}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nama Lengkap</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email</label>
                <input type="email" value={profile?.email || ''} disabled className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nomor Telepon</label>
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Alamat</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Jenis Kelamin</label>
                <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  <option value="">Pilih</option>
                  <option value="MALE">Laki-laki</option>
                  <option value="FEMALE">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">No. Rekening Bank</label>
                <input type="text" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">No. E-Wallet</label>
                <input type="text" value={ewalletNumber} onChange={e => setEwalletNumber(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={isSaving} className="px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 transition-colors duration-200 font-medium">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                <KeyRound className="w-6 h-6 text-warning-700 dark:text-warning-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Ubah Password</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Pastikan password kuat dan unik</p>
              </div>
            </div>
            {changeMsg && (
              <div className="p-3 rounded-lg border mb-4 border-neutral-200 dark:border-neutral-800">
                <p className="text-sm">{changeMsg}</p>
              </div>
            )}
            <div className="space-y-4">
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
            <div className="pt-4">
              <button type="submit" disabled={isChanging} className="px-6 py-3 rounded-lg bg-warning-600 text-white hover:bg-warning-700 disabled:opacity-60 transition-colors duration-200 font-medium">{isChanging ? 'Mengubah...' : 'Ubah Password'}</button>
            </div>
          </form>
        </div>
      </div>
    </EmployeeLayout>
  )
}
