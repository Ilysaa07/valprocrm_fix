'use client'

import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Card from '@/components/ui/Card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import Badge from '@/components/ui/Badge'
import { Download, Filter, MapPin } from 'lucide-react'
import jsPDF from 'jspdf'
import { useToast } from '@/components/providers/ToastProvider'
import dynamic from 'next/dynamic'

// Import map component dynamically to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"><MapPin className="h-8 w-8 text-gray-400" /></div>
})

interface ReportItem {
  id: string
  user: { id: string; fullName: string; email: string }
  checkInAt: string | null
  checkOutAt: string | null
  method: 'GPS' | 'IP'
  ipAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  status: 'ONTIME' | 'LATE' | 'ABSENT'
}

export default function AdminAttendancePage() {
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [items, setItems] = useState<ReportItem[]>([])
  const [summary, setSummary] = useState<{ total: number; late: number; absent: number }>({ total: 0, late: 0, absent: 0 })
  const [workStartHour, setWorkStartHour] = useState<number>(9)
  const [workEndHour, setWorkEndHour] = useState<number>(17)
  const [officeLat, setOfficeLat] = useState<string>('')
  const [officeLng, setOfficeLng] = useState<string>('')
  const [radiusMeters, setRadiusMeters] = useState<number>(200)
  const [useGeofence, setUseGeofence] = useState<boolean>(false)
  const [enforceGeofence, setEnforceGeofence] = useState<boolean>(false)
  const { showToast } = useToast()

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.append('from', new Date(from).toISOString())
      if (to) params.append('to', new Date(to).toISOString())
      const res = await fetch(`/api/attendance/report?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setItems(data.data || [])
        setSummary(data.summary || { total: 0, late: 0, absent: 0 })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // load config
    ;(async () => {
      const res = await fetch('/api/admin/attendance-config')
      const data = await res.json()
      if (res.ok && data.config) {
        setWorkStartHour(data.config.workStartHour)
        setWorkEndHour(data.config.workEndHour)
        setOfficeLat(data.config.officeLat ?? '')
        setOfficeLng(data.config.officeLng ?? '')
        setRadiusMeters(data.config.radiusMeters)
        setUseGeofence(!!data.config.useGeofence)
        setEnforceGeofence(!!data.config.enforceGeofence)
      }
    })()
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Nama', 'Email', 'Check-in', 'Check-out', 'Metode', 'Status'],
      ...items.map((i) => [
        i.user.fullName,
        i.user.email,
        i.checkInAt ? new Date(i.checkInAt).toLocaleString() : '-',
        i.checkOutAt ? new Date(i.checkOutAt).toLocaleString() : '-',
        i.method,
        i.status,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Attendance Report', 14, 16)
    let y = 26
    items.slice(0, 40).forEach((i, idx) => {
      const line = `${idx + 1}. ${i.user.fullName} | ${i.status} | In: ${i.checkInAt ? new Date(i.checkInAt).toLocaleString() : '-'} | Out: ${i.checkOutAt ? new Date(i.checkOutAt).toLocaleString() : '-'}`
      doc.text(line, 14, y)
      y += 7
      if (y > 280) { doc.addPage(); y = 20 }
    })
    doc.save(`attendance_report_${Date.now()}.pdf`)
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setOfficeLat(lat.toString())
    setOfficeLng(lng.toString())
  }

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/admin/attendance-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workStartHour,
          workEndHour,
          officeLat: officeLat ? Number(officeLat) : null,
          officeLng: officeLng ? Number(officeLng) : null,
          radiusMeters,
          useGeofence,
          enforceGeofence
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        showToast('Konfigurasi disimpan', { type: 'success', duration: 2000, idKey: 'cfg-ok' })
      } else {
        showToast(data.error || 'Gagal simpan konfigurasi', { type: 'danger', duration: 2500, idKey: 'cfg-err' })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      showToast('Terjadi kesalahan saat menyimpan konfigurasi', { type: 'danger', duration: 2500, idKey: 'cfg-err' })
    }
  }

  const exportXLSX = async () => {
    const params = new URLSearchParams()
    if (from) params.append('from', new Date(from).toISOString())
    if (to) params.append('to', new Date(to).toISOString())
    const res = await fetch(`/api/attendance/export?${params.toString()}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
              <Button variant="outline" onClick={exportPDF}><Download className="w-4 h-4 mr-2" />Export PDF</Button>
              <Button variant="outline" onClick={exportXLSX}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-500">Dari</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sampai</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchReport} disabled={loading}>{loading ? 'Memuat...' : 'Terapkan'}</Button>
            </div>
            <div className="flex items-end gap-2">
              <Badge variant="default">Total: {summary.total}</Badge>
              <Badge variant="danger">Terlambat: {summary.late}</Badge>
              <Badge variant="default">Absen: {summary.absent}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Pengaturan Kehadiran</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Jam Masuk</label>
                  <Input type="number" min={0} max={23} value={workStartHour} onChange={(e) => setWorkStartHour(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Jam Pulang</label>
                  <Input type="number" min={0} max={23} value={workEndHour} onChange={(e) => setWorkEndHour(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Radius (meter)</label>
                <Input type="number" value={radiusMeters} onChange={(e) => setRadiusMeters(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useGeofence} onChange={(e) => setUseGeofence(e.target.checked)} />
                  Gunakan Geofence
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={enforceGeofence} onChange={(e) => setEnforceGeofence(e.target.checked)} />
                  Wajib dalam radius
                </label>
              </div>
              <div className="mt-3">
                <Button onClick={saveConfig}>Simpan Pengaturan</Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Lokasi Kantor (Klik pada peta untuk mengubah)</label>
              <LocationMap 
                latitude={officeLat ? Number(officeLat) : undefined}
                longitude={officeLng ? Number(officeLng) : undefined}
                radius={radiusMeters}
                editable={true}
                onLocationChange={handleLocationChange}
                height="300px"
              />
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Nama</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2">Check-in</th>
                  <th className="px-3 py-2">Check-out</th>
                  <th className="px-3 py-2">Metode</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-6">Tidak ada data</td></tr>
                )}
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-3 py-2">{i.user.fullName}</td>
                    <td className="px-3 py-2">{i.user.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{i.checkInAt ? new Date(i.checkInAt).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{i.checkOutAt ? new Date(i.checkOutAt).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">{i.method}</td>
                    <td className="px-3 py-2">{i.status === 'LATE' ? <Badge variant="danger">Terlambat</Badge> : <Badge variant="default">{i.status}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}


