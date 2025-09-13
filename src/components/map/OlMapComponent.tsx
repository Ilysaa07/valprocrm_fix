'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'ol/ol.css'
import { RMap, ROSM, RLayerVector, RFeature } from 'rlayers'
import { RStyle, RFill, RStroke, RCircle } from 'rlayers/style'
import { Point, Circle as OlCircleGeom } from 'ol/geom'
import { fromCircle } from 'ol/geom/Polygon'
import { fromLonLat, toLonLat } from 'ol/proj'
import type { MapBrowserEvent } from 'ol'
// We will pass geometries directly to RFeature; no VectorSource/Feature instances needed
// Styling is done with RLayers style components (RStyle, RFill, RStroke, RCircle)

interface OlMapComponentProps {
	latitude: number
	longitude: number
	radius?: number
	editable?: boolean
	onLocationChange?: (lat: number, lng: number) => void
	height?: string
	width?: string
	className?: string
}

export default function OlMapComponent({
	latitude,
	longitude,
	radius = 100,
	editable = false,
	onLocationChange,
	height = '400px',
	width = '100%',
	className = ''
}: OlMapComponentProps) {
	const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: latitude, lng: longitude })
	const mapRef = useRef<RMap | null>(null)
	// No refs needed for features when using geometry props

	// Sync external props to internal state
	useEffect(() => {
		setPosition({ lat: latitude, lng: longitude })
	}, [latitude, longitude])

	// Geometries for marker and circle
	const markerGeometry = useMemo(() => {
		return new Point(fromLonLat([position.lng, position.lat]))
	}, [position])

	const circleGeometry = useMemo(() => {
		const meters = Math.max(0, radius)
		if (meters <= 0) return null
		const center3857 = fromLonLat([position.lng, position.lat])
		const circle = new OlCircleGeom(center3857, meters)
		return fromCircle(circle, 64)
	}, [position, radius])

	const onMapClick = (e: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
		if (!editable) return
		// MapBrowserEvent.originalEvent is a union; get coordinate via map API without typing it as MouseEvent
		const [lng, lat] = toLonLat(e.coordinate as [number, number])
		setPosition({ lat, lng })
		onLocationChange?.(lat, lng)
	}

	return (
		<div style={{ height, width }} className={`${className} relative border border-gray-300 rounded-lg overflow-hidden`}>
			<RMap
				className="w-full h-full"
				initial={{ center: fromLonLat([position.lng, position.lat]), zoom: 15 }}
				onClick={onMapClick}
				ref={mapRef}
			>
				<ROSM />

				{/* Circle layer (below) */}
				<RLayerVector zIndex={5}>
					{circleGeometry && (
						<>
							<RStyle>
								<RStroke color="#3b82f6" width={2} />
								<RFill color="rgba(59,130,246,0.1)" />
							</RStyle>
							<RFeature geometry={circleGeometry} />
						</>
					)}
				</RLayerVector>

				{/* Marker layer (above) */}
				<RLayerVector zIndex={10}>
					<RStyle>
						<RCircle radius={6}>
							<RFill color="#ef4444" />
							<RStroke color="#ffffff" width={2} />
						</RCircle>
					</RStyle>
					<RFeature geometry={markerGeometry} />
				</RLayerVector>
			</RMap>

			{/* Overlay info */}
			<div className="absolute top-2 right-2 bg-white rounded shadow-sm p-2 text-xs text-gray-600">
				<div>Lat: {position.lat.toFixed(6)}</div>
				<div>Lng: {position.lng.toFixed(6)}</div>
				{radius > 0 && <div>Radius: {radius}m</div>}
			</div>

			{/* Geolocation control */}
			<div className="absolute top-2 left-2">
				<button
					onClick={() => {
						if (!navigator.geolocation) return
						navigator.geolocation.getCurrentPosition(
							(pos) => {
								const lat = pos.coords.latitude
								const lng = pos.coords.longitude
								setPosition({ lat, lng })
								onLocationChange?.(lat, lng)
								const map = mapRef.current?.ol
								if (map) {
									map.getView().animate({ center: fromLonLat([lng, lat]), zoom: 16, duration: 500 })
								}
							},
							() => {},
							{ enableHighAccuracy: true, timeout: 10000 }
						)
					}}
					className="px-2 py-1 rounded bg-white shadow text-xs border hover:bg-gray-50"
				>
					Lokasi Saya
				</button>
			</div>

			{editable && (
				<div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
					Klik peta untuk mengubah lokasi
				</div>
			)}
		</div>
	)
}
