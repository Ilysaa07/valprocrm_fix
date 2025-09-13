'use client'
import React, { useEffect, useState, useMemo } from 'react'
import OlMapComponent from './OlMapComponent'

interface SimpleLocationMapProps {
  latitude?: number
  longitude?: number
  radius?: number
  editable?: boolean
  onLocationChange?: (lat: number, lng: number) => void
  height?: string
  width?: string
  className?: string
}

export default function SimpleLocationMap({
  latitude,
  longitude,
  radius = 100,
  editable = false,
  onLocationChange,
  height = '400px',
  width = '100%',
  className = '',
}: SimpleLocationMapProps) {
  const [isClient, setIsClient] = useState(false)

  // Client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  const mapComponent = useMemo(() => {
    if (!isClient) {
      return (
        <div style={{ height, width }} className={`${className} bg-gray-100 rounded animate-pulse`}>
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading map...
          </div>
        </div>
      )
    }

    return (
      <OlMapComponent
        latitude={latitude || -6.2}
        longitude={longitude || 106.8}
        radius={radius}
        editable={editable}
        onLocationChange={onLocationChange}
        height={height}
        width={width}
        className={className}
      />
    )
  }, [isClient, latitude, longitude, radius, editable, onLocationChange, height, width, className])

  return mapComponent
}

