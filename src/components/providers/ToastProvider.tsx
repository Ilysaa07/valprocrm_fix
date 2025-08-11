'use client'

import React, { createContext, useCallback, useContext, useState, useRef, useEffect, ReactNode } from 'react'
import Toast from '../ui/Toast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title?: string
  type?: ToastType
  duration?: number
  idKey?: string // untuk anti duplicate
}

interface ToastItem extends ToastOptions {
  id: string
  message: string
}

interface ToastContextProps {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const queueRef = useRef<ToastItem[]>([])
  const processingRef = useRef(false)
  const activeIdKeysRef = useRef<Set<string>>(new Set())

  const processQueue = useCallback(() => {
    if (processingRef.current) return
    processingRef.current = true

    const showNext = () => {
      if (queueRef.current.length === 0) {
        processingRef.current = false
        return
      }

      const nextToast = queueRef.current.shift()!
      setToasts((prev) => [...prev, nextToast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== nextToast.id))
        if (nextToast.idKey) activeIdKeysRef.current.delete(nextToast.idKey)
        showNext()
      }, nextToast.duration || 3000)
    }

    showNext()
  }, [])

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const idKey = options?.idKey || message

    if (activeIdKeysRef.current.has(idKey)) {
      return // skip duplicate
    }

    activeIdKeysRef.current.add(idKey)

    queueRef.current.push({
      id,
      message,
      ...options,
    })

    processQueue()
  }, [processQueue])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container - top right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
