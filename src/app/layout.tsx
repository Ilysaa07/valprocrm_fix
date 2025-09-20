import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/design-tokens.css'
import '../styles/attendance-accessibility.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
}

export const metadata: Metadata = {
  title: 'Internal System Web - Valpro Intertech',
  description: 'Comprehensive CRM system for employee management, task tracking, and business analytics',
  icons: {
    icon: [
      { url: '/logometa.png', sizes: '32x32', type: 'image/png' },
      { url: '/logometa.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/logometa.png',
    apple: '/logometa.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRM System',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/logometa.png" type="image/png" />
        <link rel="shortcut icon" href="/logometa.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logometa.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logometa.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logometa.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

