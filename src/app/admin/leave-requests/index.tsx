"use client"

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'

interface LeaveRequest {
  id: string
  user: { id: string; fullName: string; email: string }
  type: 'SICK' | 'LEAVE' | 'WFH'
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes?: string | null
}

export default function AdminLeaveRequestsPage() {
  const [data, setData] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leave-requests')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data')
      setData(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const adminNotes = status === 'REJECTED' ? prompt('Catatan admin (opsional):') || undefined : undefined
    const res = await fetch(`/api/leave-requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes })
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error || 'Gagal memperbarui status')
    } else {
      fetchData()
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Manajemen Izin</h1>
        {loading && <div>Memuat...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && data.length === 0 && <div>Tidak ada data</div>}
        {!loading && data.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Karyawan</th>
                  <th className="px-4 py-2 text-left">Jenis</th>
                  <th className="px-4 py-2 text-left">Periode</th>
                  <th className="px-4 py-2 text-left">Alasan</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.user.fullName}</div>
                      <div className="text-sm text-gray-500">{item.user.email}</div>
                    </td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2">
                      {new Date(item.startDate).toLocaleDateString('id-ID')} - {new Date(item.endDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-2 max-w-md break-words">{item.reason}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100">{item.status}</span>
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {item.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(item.id, 'APPROVED')} className="px-3 py-1 rounded bg-green-600 text-white">Setujui</button>
                          <button onClick={() => updateStatus(item.id, 'REJECTED')} className="px-3 py-1 rounded bg-red-600 text-white">Tolak</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}





