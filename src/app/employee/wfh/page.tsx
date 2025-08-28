"use client"

import { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

export default function EmployeeWfhReportPage() {
  const [desc, setDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

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

  useEffect(() => { getLocation() }, [])

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
    if (!coords) { setMsg('Lokasi belum tersedia'); return }
    const url = await uploadFile()
    if (!url) return
    const res = await fetch('/api/wfh-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityDescription: desc, screenshotUrl: url, latitude: coords.lat, longitude: coords.lng })
    })
    const json = await res.json()
    setMsg(json.error || json.message)
    if (res.ok) { setDesc(''); setFile(null) }
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Lapor Aktivitas WFH</h1>
        <p className="text-sm text-gray-600">Saat laporan dikirim, sistem akan mencatatkan jam WFH yang perlu divalidasi Admin.</p>
        <div className="space-y-3 bg-white rounded p-4">
          <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border rounded px-3 py-2" rows={4} placeholder="Deskripsi pekerjaan" />
          <input type="file" accept="image/*,video/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          <div className="text-sm text-gray-600">Koordinat: {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'memuat...'}</div>
          <div className="flex gap-2">
            <button onClick={getLocation} className="px-4 py-2 rounded bg-gray-200">Ambil Lokasi</button>
            <button onClick={submit} disabled={!file || !desc} className="px-4 py-2 rounded bg-blue-600 text-white">Kirim Laporan</button>
          </div>
          {msg && <div className="text-sm">{msg}</div>}
        </div>
      </div>
    </EmployeeLayout>
  )
}





