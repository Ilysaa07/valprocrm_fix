'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface LocationMapProps {
  latitude?: number | null
  longitude?: number | null
  radius?: number
  editable?: boolean
  onLocationChange?: (lat: number, lng: number) => void
  height?: string
  width?: string
  className?: string
}

function MapClickHandler({ onLocationChange }: { onLocationChange?: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click: (e) => {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export default function LocationMap({
  latitude = -6.2,
  longitude = 106.8,
  radius = 200,
  editable = false,
  onLocationChange,
  height = '300px',
  width = '100%',
  className = '',
}: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>(
    [latitude || -6.2, longitude || 106.8]
  )
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude])
      mapRef.current?.setView([latitude, longitude], 15)
    }
  }, [latitude, longitude])

  const handleLocationChange = (lat: number, lng: number) => {
    if (editable) {
      setPosition([lat, lng])
      if (onLocationChange) {
        onLocationChange(lat, lng)
      }
    }
  }

  return (
    <div style={{ height, width }} className={className}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        ref={mapRef as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
        {radius > 0 && (
          <Circle
            center={position}
            radius={radius}
            pathOptions={{
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              color: '#3b82f6',
              weight: 1,
            }}
          />
        )}
        {editable && <MapClickHandler onLocationChange={handleLocationChange} />}
      </MapContainer>
    </div>
  )
}