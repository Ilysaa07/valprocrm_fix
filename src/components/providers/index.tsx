'use client'

import { ReactNode } from 'react'
import { SessionProvider } from './SessionProvider'
import { ToastProvider } from './ToastProvider'
import ThemeProvider from '@/components/layout/ThemeProvider'
import SocketBootstrapper from '@/lib/socket'
import { PWAProvider } from '@/lib/pwa'
import { InstallPrompt } from '@/components/ui/InstallPrompt'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <PWAProvider>
            <SocketBootstrapper />
            {children}
            <InstallPrompt />
          </PWAProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}