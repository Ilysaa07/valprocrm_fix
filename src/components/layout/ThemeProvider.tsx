"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'light', 
  toggle: () => {},
  setTheme: () => {},
  isLoading: true
})

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize theme on mount to prevent hydration mismatch
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check localStorage first
        const stored = localStorage.getItem('valpro-theme') as Theme | null
        
        if (stored === 'light' || stored === 'dark') {
          setTheme(stored)
        } else {
          // Fall back to system preference
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          const systemTheme = prefersDark ? 'dark' : 'light'
          setTheme(systemTheme)
          localStorage.setItem('valpro-theme', systemTheme)
        }
      } catch (error) {
        console.warn('Failed to initialize theme:', error)
        setTheme('light')
      } finally {
        setMounted(true)
        setIsLoading(false)
      }
    }

    initializeTheme()
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const stored = localStorage.getItem('valpro-theme')
      if (!stored) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('valpro-theme', newTheme)
      }
    }
    
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined' && mounted) {
      const root = document.documentElement
      const body = document.body
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark')
      body.classList.remove('light', 'dark')
      
      // Add new theme class
      root.classList.add(theme)
      body.classList.add(theme)
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff')
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('valpro-theme', theme)
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error)
      }
    }
  }, [theme, mounted])

  const value = useMemo(() => ({ 
    theme, 
    toggle: () => {
      const newTheme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
    },
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
    },
    isLoading
  }), [theme, isLoading])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div 
        style={{ 
          visibility: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={value}>
      <div className="theme-transition">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

