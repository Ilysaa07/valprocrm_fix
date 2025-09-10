"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'
import Badge from '@/components/ui/Badge'
import { CheckCircle2, XCircle, RefreshCw, User, Calendar, Image as ImageIcon, MapPin } from 'lucide-react'

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
})

interface WfhLogItem {
  id: string
  user: { id: string; fullName: string; email: string }
  activityDescription: string
  screenshotUrl: string
  latitude: number
  longitude: number
  logTime: string
}

export default function AdminWfhValidationPage() {
  const [data, setData] = useState<WfhLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const { showToast } = useToast()

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wfh-logs/pending')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data')
      setData(json.data || [])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function validateLog(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const confirmMsg = status === 'APPROVED' ? 'Setujui log WFH ini?' : 'Tolak log WFH ini?'
      if (!window.confirm(confirmMsg)) return

      setProcessingId(id)
      const adminNotes = status === 'REJECTED' ? (notes[id]?.trim() || undefined) : (notes[id]?.trim() || undefined)
      const res = await fetch(`/api/wfh-logs/${id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes })
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error || 'Gagal memproses validasi', { title: 'Error', type: 'error' })
        return
      }
      showToast(json.message || 'Validasi berhasil', { title: 'Sukses', type: 'success' })
      setNotes(prev => ({ ...prev, [id]: '' }))
      fetchData()
    } catch (e) {
      showToast('Terjadi kesalahan saat memproses', { title: 'Error', type: 'error' })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Validasi WFH</h1>
          <Button variant="outline" onClick={fetchData} disabled={loading} className="flex items-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
        </div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        )}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && data.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">Tidak ada log menunggu validasi</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow p-4 space-y-3 dark:text-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" /> {item.user.fullName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.user.email}</div>
                </div>
                <Badge variant="secondary">WFH</Badge>
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-100">{item.activityDescription}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Log time: {new Date(item.logTime).toLocaleString('id-ID')}
              </div>
              <div className="flex items-center gap-3">
                <a href={item.screenshotUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline text-sm flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> Lihat Screenshot
                </a>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-1">
                  <MapPin className="w-3 h-3" /> Koordinat: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </div>
              </div>
              <LocationMap latitude={item.latitude} longitude={item.longitude} radius={0} height="220px" />
              <div className="space-y-2">
                <label className="block text-sm text-gray-700 dark:text-gray-300">Catatan Admin (opsional)</label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Tulis catatan untuk karyawan..."
                  value={notes[item.id] || ''}
                  onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => validateLog(item.id, 'APPROVED')}
                  disabled={processingId === item.id}
                  className="flex items-center gap-2"
                >
                  {processingId === item.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Validasi Absen
                </Button>
                <Button
                  variant="danger"
                  onClick={() => validateLog(item.id, 'REJECTED')}
                  disabled={processingId === item.id}
                  className="flex items-center gap-2"
                >
                  {processingId === item.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}





