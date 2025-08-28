"use client"

import { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

type LeaveType = 'SICK' | 'LEAVE' | 'WFH'

export default function EmployeeLeaveRequestsPage() {
  const [type, setType] = useState<LeaveType>('SICK')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [data, setData] = useState<any[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/leave-requests/me')
    const json = await res.json()
    if (res.ok) setData(json.data || [])
  }

  useEffect(() => { load() }, [])

  async function submit() {
    setMsg(null)
    const res = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString(), reason })
    })
    const json = await res.json()
    setMsg(json.error || json.message)
    if (res.ok) { setReason(''); load() }
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Pengajuan Izin</h1>
        <div className="bg-white rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={type} onChange={e => setType(e.target.value as LeaveType)} className="border rounded px-3 py-2">
              <option value="SICK">Sakit</option>
              <option value="LEAVE">Izin</option>
              <option value="WFH">WFH</option>
            </select>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border rounded px-3 py-2" />
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Alasan" rows={3} />
          <button onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white">Ajukan</button>
          {msg && <div className="text-sm mt-1">{msg}</div>}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Riwayat Pengajuan</h2>
          <div className="overflow-x-auto bg-white rounded">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Jenis</th>
                  <th className="px-4 py-2 text-left">Periode</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((r: any) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{r.type}</td>
                    <td className="px-4 py-2">{new Date(r.startDate).toLocaleDateString('id-ID')} - {new Date(r.endDate).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}





