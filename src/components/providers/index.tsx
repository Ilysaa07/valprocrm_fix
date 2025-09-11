'use client'

import { ReactNode } from 'react'
import { SessionProvider } from './SessionProvider'
import { ToastProvider } from './ToastProvider'
import ThemeProvider from '@/components/layout/ThemeProvider'
import SocketBootstrapper from '@/lib/socket'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <SocketBootstrapper />
          {children}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}