'use client'

import dynamic from 'next/dynamic'
import { LocationMapProps } from './LocationMap'

// Dynamically import LocationMap to prevent SSR issues
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded animate-pulse flex items-center justify-center" style={{ height: '300px', width: '100%' }}>
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
})

export default function DynamicLocationMap(props: LocationMapProps) {
  return <LocationMap {...props} />
}
