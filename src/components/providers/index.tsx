'use client'

import { ReactNode } from 'react'
import { SessionProvider } from './SessionProvider'
import { ToastProvider } from './ToastProvider'
import ThemeProvider from '@/components/layout/ThemeProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}