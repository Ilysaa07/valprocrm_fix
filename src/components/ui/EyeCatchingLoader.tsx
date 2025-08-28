'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface EyeCatchingLoaderProps {
  message?: string
  submessage?: string
  className?: string
  variant?: 'default' | 'gradient' | 'pulse' | 'bounce'
}

export default function EyeCatchingLoader({ 
  message = "Memuat...", 
  submessage = "Mohon tunggu sebentar",
  className,
  variant = 'gradient'
}: EyeCatchingLoaderProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const LoaderVariants = {
    default: (
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
    ),
    gradient: (
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
          <div className="bg-white dark:bg-gray-900 rounded-full h-full w-full flex items-center justify-center">
            <div className="animate-pulse w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>
    ),
    pulse: (
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce"></div>
      </div>
    ),
    bounce: (
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-gray-600 rounded-full animate-pulse">
          <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
      className
    )}>
      <div className="text-center space-y-6 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-2xl max-w-md mx-4">
        {/* Animated Background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 animate-pulse"></div>
        
        <div className="relative z-10">
          {/* Main Loader */}
          <div className="flex justify-center mb-6">
            {LoaderVariants[variant]}
          </div>

          {/* Loading Text */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
              {message}
              <span className="w-8 text-left text-blue-500">{dots}</span>
            </h3>
            
            {submessage && (
              <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
                {submessage}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-500 rounded-full animate-ping opacity-75 [animation-delay:0.5s]"></div>
        </div>
      </div>
    </div>
  )
}

// Compilation Loading Component
export function CompilationLoader() {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = [
    "Memproses file...",
    "Mengompilasi kode...", 
    "Mengoptimalkan build...",
    "Menyelesaikan..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <EyeCatchingLoader
      message="Mengompilasi Aplikasi"
      submessage={steps[currentStep]}
      variant="gradient"
    />
  )
}

// Page Loading Component  
export function PageLoader({ pageName }: { pageName?: string }) {
  return (
    <EyeCatchingLoader
      message={`Memuat ${pageName || 'Halaman'}`}
      submessage="Menyiapkan konten untuk Anda"
      variant="pulse"
    />
  )
}

// Data Loading Component
export function DataLoader() {
  return (
    <EyeCatchingLoader
      message="Memuat Data"
      submessage="Mengambil informasi terbaru"
      variant="bounce"
    />
  )
}
