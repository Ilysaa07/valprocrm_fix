'use client'

import { ReactNode } from 'react'
import { SessionProvider } from './SessionProvider'
import { ToastProvider } from './ToastProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}