"use client"

import { useEffect, useMemo, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

type AttendanceStatus = 'PRESENT' | 'LATE' | 'SICK' | 'LEAVE' | 'WFH'

interface AttendanceRecord {
  id: string
  checkInTime: string | null
  checkOutTime: string | null
  status: AttendanceStatus
}

interface LeaveRequest {
  id: string
  type: string
  startDate: string
  endDate: string
  reason: string
}

interface CalendarData {
  attendance: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
}

const statusColor: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  SICK: 'bg-yellow-100 text-yellow-700',
  LEAVE: 'bg-blue-100 text-blue-700',
  WFH: 'bg-purple-100 text-purple-700',
}

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  const days: Date[] = []
  while (date.getMonth() === month - 1) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export default function EmployeeCalendarPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [calendarData, setCalendarData] = useState<CalendarData>({ attendance: [], leaveRequests: [] })
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const days = useMemo(() => getDaysInMonth(year, month), [year, month])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/attendance/calendar?month=${month}&year=${year}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat kalender')
      
      // Handle the nested data structure from API
      const data = json.data || { attendance: [], leaveRequests: [] }
      setCalendarData(data)
      
      // Calculate summary from the data
      const attendanceCounts = data.attendance.reduce((acc: Record<string, number>, record: AttendanceRecord) => {
        acc[record.status] = (acc[record.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Add leave requests to summary
      if (data.leaveRequests) {
        attendanceCounts['LEAVE'] = (attendanceCounts['LEAVE'] || 0) + data.leaveRequests.length
      }
      
      setSummary(attendanceCounts)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [month, year])

  const recordByDay = useMemo(() => {
    const map = new Map<number, AttendanceRecord>()
    
    // Process attendance records
    if (calendarData.attendance && Array.isArray(calendarData.attendance)) {
      for (const rec of calendarData.attendance) {
        if (rec && rec.checkInTime) {
          try {
            const d = new Date(rec.checkInTime)
            if (!isNaN(d.getTime())) {
              map.set(d.getDate(), rec)
            }
          } catch (e) {
            console.warn('Invalid date in attendance record:', rec)
          }
        }
      }
    }
    
    // Process leave requests
    if (calendarData.leaveRequests && Array.isArray(calendarData.leaveRequests)) {
      for (const leave of calendarData.leaveRequests) {
        if (leave && leave.startDate && leave.endDate) {
          try {
            const startDate = new Date(leave.startDate)
            const endDate = new Date(leave.endDate)
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              // Add leave status to all days in the range
              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                if (d.getMonth() === month - 1 && d.getFullYear() === year) {
                  const day = d.getDate()
                  if (!map.has(day)) {
                    map.set(day, {
                      id: leave.id,
                      checkInTime: leave.startDate,
                      checkOutTime: leave.endDate,
                      status: 'LEAVE'
                    })
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Invalid date in leave request:', leave)
          }
        }
      }
    }
    
    return map
  }, [calendarData, month, year])

  function changeMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m); setYear(y)
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Kalender Kehadiran</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="px-2 py-1 border rounded">Prev</button>
            <div className="min-w-[160px] text-center">{new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => changeMonth(1)} className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>

        {loading && <div>Memuat...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid grid-cols-7 gap-2 bg-white p-3 rounded">
          {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(d => (
            <div key={d} className="text-center text-sm font-medium text-gray-600">{d}</div>
          ))}
          {days.map((d) => {
            const rec = recordByDay.get(d.getDate())
            return (
              <div key={d.toISOString()} className="border rounded p-2 h-24 flex flex-col">
                <div className="text-sm text-gray-600">{d.getDate()}</div>
                {rec && (
                  <div className={`mt-2 inline-block px-2 py-1 text-xs rounded ${statusColor[rec.status]}`}>{rec.status}</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded p-3">
          <h2 className="font-medium mb-2">Rekap Bulanan</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {(['PRESENT','SICK','LEAVE','WFH'] as AttendanceStatus[]).map(s => (
              <div key={s} className={`px-2 py-1 rounded ${statusColor[s]}`}>{s}: {summary[s] || 0}</div>
            ))}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}





