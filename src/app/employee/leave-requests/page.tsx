'use client'

import React, { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { io, Socket } from 'socket.io-client'

interface LeaveItem {
  id: string
  type: 'ANNUAL' | 'SICK' | 'PERMIT' | 'OTHER'
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export default function EmployeeLeaveRequestsPage() {
  const [items, setItems] = useState<LeaveItem[]>([])
  const [type, setType] = useState('ANNUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const fetchItems = async () => {
    const res = await fetch('/api/leave-requests')
    const data = await res.json()
    if (res.ok) setItems(data.items || [])
  }

  useEffect(() => { fetchItems() }, [])

  useEffect(() => {
    let s: Socket | null = null
    try {
      const g = (window as unknown as { socket?: Socket }).socket
      s = g || io()
      s.on('leave_request_updated', () => fetchItems())
    } catch {}
    return () => { try { s?.off('leave_request_updated'); if (!(window as any).socket) s?.disconnect() } catch {} }
  }, [])

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, startDate, endDate, reason })
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Pengajuan dikirim', { type: 'success', duration: 2000, idKey: 'lr-ok' })
        setReason(''); setStartDate(''); setEndDate('')
        fetchItems()
      } else {
        showToast(data.error || 'Gagal', { type: 'danger', duration: 2500, idKey: 'lr-err' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <EmployeeLayout>
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Pengajuan Izin/Cuti</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500">Jenis</label>
              <select className="w-full border rounded px-2 py-2" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ANNUAL">Cuti Tahunan</option>
                <option value="SICK">Sakit</option>
                <option value="PERMIT">Izin</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Mulai</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Selesai</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Alasan</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tulis alasan" />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={submit} disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Pengajuan'}</Button>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2 text-left">Alasan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (<tr><td colSpan={4} className="text-center text-gray-500 py-6">Belum ada pengajuan</td></tr>)}
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-3 py-2 text-center">{i.type}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{new Date(i.startDate).toLocaleDateString()} - {new Date(i.endDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-left max-w-md truncate" title={i.reason}>{i.reason}</td>
                    <td className="px-3 py-2 text-center">{i.status === 'PENDING' ? <Badge variant="default">Menunggu</Badge> : i.status === 'APPROVED' ? <Badge variant="success">Disetujui</Badge> : <Badge variant="danger">Ditolak</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </EmployeeLayout>
  )
}


