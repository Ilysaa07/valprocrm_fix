'use client'

import React, { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Card from '@/components/ui/Card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Check, X, Filter } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import SocketClient from '@/lib/socket'

interface LeaveItem {
  id: string
  user: { id: string; fullName: string; email: string }
  type: 'ANNUAL' | 'SICK' | 'PERMIT' | 'OTHER'
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export default function AdminLeaveRequestsPage() {
  const [items, setItems] = useState<LeaveItem[]>([])
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      const res = await fetch(`/api/admin/leave-requests?${params.toString()}`)
      const data = await res.json()
      if (res.ok) setItems(data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [status])

  useEffect(() => {
    const socket = SocketClient.getSocket()
    
    socket.on('leave_request_created', () => fetchItems())
    socket.on('leave_request_updated', () => fetchItems())
    
    return () => {
      socket.off('leave_request_created')
      socket.off('leave_request_updated')
    }
  }, [])

  const act = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/leave-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    const data = await res.json()
    if (res.ok) {
      showToast(`Pengajuan ${action === 'approve' ? 'disetujui' : 'ditolak'}`, { type: 'success', duration: 2000, idKey: `${id}-${action}` })
      fetchItems()
    } else {
      showToast(data.error || 'Gagal memproses', { type: 'danger', duration: 2500, idKey: `${id}-err` })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600"><Filter className="w-4 h-4" /><span className="text-sm">Filter</span></div>
            <div className="flex items-center gap-2">
              <select className="border rounded px-2 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Semua</option>
                <option value="PENDING">Menunggu</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
              <Button variant="outline" onClick={fetchItems} disabled={loading}>{loading ? 'Memuat...' : 'Muat Ulang'}</Button>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Nama</th>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2 text-left">Alasan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-6">Tidak ada pengajuan</td></tr>
                )}
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-3 py-2 text-left whitespace-nowrap">{i.user.fullName}</td>
                    <td className="px-3 py-2 text-center">{i.type}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{new Date(i.startDate).toLocaleDateString()} - {new Date(i.endDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-left max-w-md truncate" title={i.reason}>{i.reason}</td>
                    <td className="px-3 py-2 text-center">{
                      i.status === 'PENDING' ? <Badge variant="default">Menunggu</Badge> : i.status === 'APPROVED' ? <Badge variant="success">Disetujui</Badge> : <Badge variant="danger">Ditolak</Badge>
                    }</td>
                    <td className="px-3 py-2 text-center">
                      {i.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => act(i.id, 'approve')}><Check className="w-4 h-4 mr-1" />Setujui</Button>
                          <Button size="sm" variant="outline" onClick={() => act(i.id, 'reject')}><X className="w-4 h-4 mr-1" />Tolak</Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Tidak ada aksi</span>
                      )}
                    </td>
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


