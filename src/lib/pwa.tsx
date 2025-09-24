'use client'

import { useEffect } from 'react'

export function PWAProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window === 'undefined') return
		if (!('serviceWorker' in navigator)) return
		navigator.serviceWorker.register('/sw.js').catch(() => {})
	}, [])

	return <>{children}</>
}
