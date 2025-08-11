'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
  message: string
  title?: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

export default function Toast({ message, title = 'Notifikasi', type = 'info' }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animasi masuk
    const showTimer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(showTimer)
  }, [])

  const bgColors: Record<string, string> = {
    success: 'bg-green-50 border-green-500 text-green-700',
    error: 'bg-red-50 border-red-500 text-red-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700',
  }

  const icons: Record<string, JSX.Element> = {
    success: (
      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div
      className={`w-72 max-w-full shadow-lg rounded-lg border-l-4 p-3 flex items-start space-x-3 transition-all duration-300 transform
        ${bgColors[type]}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
