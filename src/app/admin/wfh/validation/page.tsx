"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/layout/AdminLayout'

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-100 rounded animate-pulse" />
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
    const adminNotes = status === 'REJECTED' ? prompt('Catatan admin (opsional):') || undefined : undefined
    const res = await fetch(`/api/wfh-logs/${id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes })
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error || 'Gagal memproses validasi')
    } else {
      alert(json.message || 'Validasi berhasil')
      fetchData()
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Validasi WFH</h1>
        {loading && <div>Memuat...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && data.length === 0 && <div>Tidak ada log menunggu validasi</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div>
                <div className="font-medium">{item.user.fullName}</div>
                <div className="text-sm text-gray-500">{item.user.email}</div>
              </div>
              <div className="text-sm">{item.activityDescription}</div>
              <div className="text-xs text-gray-500">
                Log time: {new Date(item.logTime).toLocaleString('id-ID')}
              </div>
              <a href={item.screenshotUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Lihat Screenshot</a>
              <LocationMap latitude={item.latitude} longitude={item.longitude} radius={0} height="220px" />
              <div className="flex gap-2">
                <button onClick={() => validateLog(item.id, 'APPROVED')} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Validasi Absen</button>
                <button onClick={() => validateLog(item.id, 'REJECTED')} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Tolak</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}





