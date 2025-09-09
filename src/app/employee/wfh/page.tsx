"use client"

import { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import { useSession } from 'next-auth/react'

export default function EmployeeWfhReportPage() {
  const { data: session } = useSession()
  const [desc, setDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [todayStatus, setTodayStatus] = useState<{
    hasAttendance: boolean
    hasWFH: boolean
    wfhStatus?: string
  } | null>(null)

  function getLocation() {
    if (!navigator.geolocation) {
      setMsg('Geolocation tidak didukung')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setMsg(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => { 
    getLocation() 
    checkTodayStatus()
  }, [])

  const checkTodayStatus = async () => {
    try {
      const res = await fetch('/api/attendance/today')
      if (res.ok) {
        const data = await res.json()
        setTodayStatus({
          hasAttendance: !!data.attendance,
          hasWFH: !!data.wfhLog,
          wfhStatus: data.wfhLog?.status
        })
      }
    } catch (error) {
      console.error('Error checking today status:', error)
    }
  }

  async function uploadFile(): Promise<string | null> {
    if (!file) return null
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setMsg(json.error || 'Upload gagal'); return null }
    return json.file?.url || null
  }

  async function submit() {
    setMsg(null)
    setLoading(true)
    
    try {
      if (!coords) { 
        setMsg('Lokasi belum tersedia'); 
        setLoading(false)
        return 
      }

      if (!desc || desc.trim().length < 3) {
        setMsg('Deskripsi minimal 3 karakter')
        setLoading(false)
        return
      }

      if (!file) {
        setMsg('File bukti wajib diupload')
        setLoading(false)
        return
      }
      
      if (todayStatus?.hasAttendance) {
        setMsg('Anda sudah melakukan absensi kantor hari ini. Tidak dapat mengajukan WFH.')
        setLoading(false)
        return
      }
      
      if (todayStatus?.hasWFH) {
        setMsg('Anda sudah mengajukan WFH hari ini. Tidak dapat mengajukan lagi.')
        setLoading(false)
        return
      }

      const url = await uploadFile()
      if (!url) {
        setLoading(false)
        return
      }
      
      const res = await fetch('/api/wfh-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activityDescription: desc.trim(), 
          screenshotUrl: url, 
          latitude: coords.lat, 
          longitude: coords.lng 
        })
      })
      const json = await res.json()

      if (!res.ok) {
        const details = Array.isArray(json?.details)
          ? json.details.map((d: any) => d.message).join('; ')
          : undefined
        setMsg(json.error || details || 'Validasi gagal')
        return
      }

      setMsg(json.message || 'Berhasil mengirim WFH')
      setDesc('')
      setFile(null)
      checkTodayStatus() // Refresh status
    } catch (error) {
      setMsg('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = () => {
    if (!todayStatus) return null
    
    if (todayStatus.hasAttendance) {
      return {
        type: 'error',
        message: 'Anda sudah melakukan absensi kantor hari ini. Fitur WFH tidak tersedia.'
      }
    }
    
    if (todayStatus.hasWFH) {
      const statusText = todayStatus.wfhStatus === 'PENDING' ? 'menunggu validasi' : 
                        todayStatus.wfhStatus === 'APPROVED' ? 'disetujui' : 'ditolak'
      return {
        type: 'info',
        message: `Anda sudah mengajukan WFH hari ini (Status: ${statusText}).`
      }
    }
    
    return {
      type: 'success',
      message: 'Anda dapat mengajukan WFH hari ini.'
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Lapor Aktivitas WFH</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Saat laporan dikirim, sistem akan mencatatkan jam WFH yang perlu divalidasi Admin.</p>
        </div>

        {/* Today's Status */}
        {statusInfo && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Status Hari Ini</h2>
            <div className={`flex items-center space-x-3 p-4 rounded-xl ${
              statusInfo.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
              statusInfo.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
              'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                statusInfo.type === 'error' ? 'bg-red-500' :
                statusInfo.type === 'info' ? 'bg-blue-500' :
                'bg-green-500'
              }`}></div>
              <span className={`text-sm ${
                statusInfo.type === 'error' ? 'text-red-700 dark:text-red-300' :
                statusInfo.type === 'info' ? 'text-blue-700 dark:text-blue-300' :
                'text-green-700 dark:text-green-300'
              }`}>
                {statusInfo.message}
              </span>
            </div>
          </div>
        )}

        {/* Location Status */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Status Lokasi</h2>
          <div className="flex items-center space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <div className={`w-3 h-3 rounded-full ${coords ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Koordinat: {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Memuat lokasi...'}
            </span>
          </div>
        </div>

        {/* WFH Report Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Form Laporan WFH</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Deskripsi Pekerjaan *
              </label>
              <textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                rows={4} 
                placeholder="Jelaskan aktivitas pekerjaan yang telah Anda lakukan hari ini..."
                disabled={todayStatus?.hasAttendance || (todayStatus?.hasWFH && todayStatus?.wfhStatus === 'PENDING')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Upload Bukti (Screenshot/Dokumen) *
              </label>
              <input 
                type="file" 
                accept="image/*,video/*,application/pdf" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={todayStatus?.hasAttendance || (todayStatus?.hasWFH && todayStatus?.wfhStatus === 'PENDING')}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Format yang didukung: JPG, PNG, PDF, MP4. Maksimal 10MB.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={getLocation} 
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="font-medium">Ambil Lokasi</span>
              </button>
              
              <button 
                onClick={submit} 
                disabled={!file || !desc || !coords || loading || todayStatus?.hasAttendance || (todayStatus?.hasWFH && todayStatus?.wfhStatus === 'PENDING')}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-4 h-4 rounded-full bg-white"></div>
                <span className="font-medium">{loading ? 'Mengirim...' : 'Kirim Laporan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {msg && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">{msg}</span>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}





