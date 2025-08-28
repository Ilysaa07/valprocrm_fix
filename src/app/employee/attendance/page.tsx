"use client"

import { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

export default function EmployeeAttendancePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [getting, setGetting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function getLocation() {
    if (!navigator.geolocation) {
      setMessage('Geolocation tidak didukung browser ini')
      return
    }
    setGetting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGetting(false)
      },
      (err) => {
        setMessage(err.message)
        setGetting(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => { getLocation() }, [])

  async function checkIn() {
    if (!coords) return
    const res = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
    })
    const json = await res.json()
    setMessage(json.error || json.message)
  }

  async function checkOut() {
    const res = await fetch('/api/attendance/check-out', { method: 'POST' })
    const json = await res.json()
    setMessage(json.error || json.message)
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Absensi</h1>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Koordinat: {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'memuat...'}</div>
          <div className="flex gap-2">
            <button onClick={getLocation} disabled={getting} className="px-4 py-2 rounded bg-gray-200">Ambil Lokasi</button>
            <button onClick={checkIn} disabled={!coords} className="px-4 py-2 rounded bg-green-600 text-white">Clock In</button>
            <button onClick={checkOut} className="px-4 py-2 rounded bg-red-600 text-white">Clock Out</button>
          </div>
          {message && <div className="text-sm">{message}</div>}
        </div>
      </div>
    </EmployeeLayout>
  )
}





