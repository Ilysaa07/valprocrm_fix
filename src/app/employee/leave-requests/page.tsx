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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Pengajuan Izin</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Ajukan permintaan izin, sakit, atau WFH untuk mendapatkan persetujuan dari admin</p>
        </div>

        {/* Leave Request Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Form Pengajuan</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Jenis Izin *
                </label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as LeaveType)} 
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="SICK">Sakit</option>
                  <option value="LEAVE">Izin</option>
                  <option value="WFH">WFH</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tanggal Mulai *
                </label>
                <input 
                  type="date" 
                  value={start} 
                  onChange={e => setStart(e.target.value)} 
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tanggal Selesai *
                </label>
                <input 
                  type="date" 
                  value={end} 
                  onChange={e => setEnd(e.target.value)} 
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Alasan *
              </label>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                placeholder="Jelaskan alasan pengajuan izin Anda..." 
                rows={3} 
              />
            </div>
            
            <button 
              onClick={submit} 
              disabled={!type || !start || !end || !reason}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-4 h-4 rounded-full bg-white"></div>
              <span className="font-medium">Ajukan Izin</span>
            </button>
            
            {msg && (
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">{msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Leave History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Riwayat Pengajuan</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Alasan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
                {data.map((r: any) => (
                  <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        r.type === 'SICK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        r.type === 'LEAVE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {r.type === 'SICK' ? 'Sakit' : r.type === 'LEAVE' ? 'Izin' : 'WFH'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                      {new Date(r.startDate).toLocaleDateString('id-ID')} - {new Date(r.endDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        r.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {r.status === 'PENDING' ? 'Menunggu' : r.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                      <div className="max-w-xs truncate" title={r.reason}>
                        {r.reason}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Belum ada pengajuan</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Anda belum pernah mengajukan izin sebelumnya.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}





