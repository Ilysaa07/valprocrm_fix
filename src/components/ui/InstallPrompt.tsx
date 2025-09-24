'use client'

import { useEffect, useState } from 'react'

export function InstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		const handler = (e: any) => {
			e.preventDefault()
			setDeferredPrompt(e)
			setVisible(true)
		}
		window.addEventListener('beforeinstallprompt', handler as any)
		return () => window.removeEventListener('beforeinstallprompt', handler as any)
	}, [])

	if (!visible) return null

	const onInstall = async () => {
		try {
			await deferredPrompt.prompt()
			await deferredPrompt.userChoice
		} catch {}
		setVisible(false)
		setDeferredPrompt(null)
	}

	return (
		<div style={{position:'fixed',bottom:16,left:0,right:0,display:'flex',justifyContent:'center',zIndex:9999}}>
			<div style={{background:'#111827',color:'#fff',padding:'10px 14px',borderRadius:9999,boxShadow:'0 10px 30px rgba(0,0,0,0.25)'}}>
				<span style={{marginRight:12}}>Install aplikasi ini?</span>
				<button onClick={onInstall} style={{background:'#6366f1',color:'#fff',border:0,padding:'6px 12px',borderRadius:9999,cursor:'pointer'}}>Install</button>
			</div>
		</div>
	)
}
