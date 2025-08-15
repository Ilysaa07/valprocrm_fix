'use client'

import React, { useState, useEffect } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

// Import map component dynamically to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"><MapPin className="h-8 w-8 text-gray-400" /></div>
})

export default function EmployeeAttendancePage() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<string>('')
  const [distance, setDistance] = useState<number | null>(null)
  const [config, setConfig] = useState<{ officeLat?: number; officeLng?: number; radiusMeters?: number; useGeofence?: boolean } | null>(null)
  const [userLocation, setUserLocation] = useState<{lat?: number; lng?: number} | null>(null)

  useEffect(() => {
    // Load attendance config when component mounts
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/attendance-config')
        const data = await res.json()
        if (res.ok && data.config) {
          setConfig(data.config)
        }
      } catch (error) {
        console.error('Error loading attendance config:', error)
      }
    }
    
    loadConfig()
  }, [])

  const getIp = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json')
      const data = await res.json()
      return data.ip as string
    } catch {
      return ''
    }
  }

  const getUserLocation = async () => {
    return new Promise<{ lat?: number; lng?: number }>((resolve) => {
      if (!navigator.geolocation) return resolve({})
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(location)
          resolve(location)
        },
        () => resolve({})
      )
    })
  }

  const doCheckIn = async () => {
    setLoading(true)
    try {
      const method = 'GPS'
      const coords = await getUserLocation()
      const ip = await getIp()
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, latitude: coords.lat, longitude: coords.lng, ipAddress: ip })
      })
      const data = await res.json()
      setDistance(data.distanceMeters ?? null)
      setConfig(data.config ?? null)
      setLastResult(res.ok ? `Check-in berhasil (${data.attendance.status})` : (data.error || 'Gagal'))
    } finally {
      setLoading(false)
    }
  }

  const doCheckOut = async () => {
    setLoading(true)
    try {
      const coords = await getUserLocation()
      const res = await fetch('/api/attendance/check-out', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
      })
      const data = await res.json()
      setLastResult(res.ok ? `Check-out berhasil (${data.user?.fullName || ''})` : (data.error || 'Gagal'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <EmployeeLayout>
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Kehadiran</h2>
          <p className="text-gray-600 mb-4">Lakukan check-in/check-out menggunakan GPS atau IP address</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex gap-2 mb-3">
                <Button onClick={doCheckIn} disabled={loading}>Check-in</Button>
                <Button variant="outline" onClick={doCheckOut} disabled={loading}>Check-out</Button>
              </div>
              {lastResult && <p className="text-sm text-gray-700 mb-3">{lastResult}</p>}
              {config?.useGeofence && (
                <div className="flex items-center gap-2">
                  <Badge variant="default">Radius: {config.radiusMeters}m</Badge>
                  {typeof distance === 'number' && <Badge variant={distance <= (config.radiusMeters || 0) ? 'success' : 'danger'}>Jarak: {distance}m</Badge>}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Lokasi Kantor</h3>
              {config && config.officeLat && config.officeLng ? (
                <LocationMap
                  latitude={config.officeLat}
                  longitude={config.officeLng}
                  radius={config.radiusMeters || 200}
                  height="200px"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg h-[200px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Lokasi kantor belum diatur</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </EmployeeLayout>
  )
}


