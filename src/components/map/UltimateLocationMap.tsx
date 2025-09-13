'use client'
import React, { useEffect, useState, useMemo } from 'react'
import MapboxMapComponent from './MapboxMapComponent'

interface UltimateLocationMapProps {
  latitude?: number
  longitude?: number
  radius?: number
  editable?: boolean
  onLocationChange?: (lat: number, lng: number) => void
  height?: string
  width?: string
  className?: string
}

export default function UltimateLocationMap({
  latitude,
  longitude,
  radius = 100,
  editable = false,
  onLocationChange,
  height = '400px',
  width = '100%',
  className = '',
}: UltimateLocationMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(0)

  // Client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Force remount when coordinates change
  useEffect(() => {
    if (isClient && latitude && longitude) {
      setMapKey(prev => prev + 1)
    }
  }, [isClient, latitude, longitude])

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
      <MapboxMapComponent
        key={mapKey}
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
  }, [isClient, mapKey, latitude, longitude, radius, editable, onLocationChange, height, width, className])

  return mapComponent
}