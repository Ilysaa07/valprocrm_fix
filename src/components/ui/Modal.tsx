'use client'

import { ReactNode, useEffect, useState } from 'react'
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  variant = 'default'
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4'
  }

  const variantConfig = {
    default: {
      headerBg: 'bg-gradient-to-r from-card to-surface',
      headerText: 'text-text-primary',
      headerBorder: 'border-border',
      icon: null
    },
    success: {
      headerBg: 'bg-gradient-to-r from-success/10 to-success/5',
      headerText: 'text-success-dark',
      headerBorder: 'border-success/20',
      icon: CheckCircle
    },
    error: {
      headerBg: 'bg-gradient-to-r from-error/10 to-error/5',
      headerText: 'text-error-dark',
      headerBorder: 'border-error/20',
      icon: XCircle
    },
    warning: {
      headerBg: 'bg-gradient-to-r from-warning/10 to-warning/5',
      headerText: 'text-warning-dark',
      headerBorder: 'border-warning/20',
      icon: AlertTriangle
    },
    info: {
      headerBg: 'bg-gradient-to-r from-accent/10 to-accent/5',
      headerText: 'text-accent-dark',
      headerBorder: 'border-accent/20',
      icon: Info
    }
  }

  const config = variantConfig[variant]
  const IconComponent = config.icon

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      document.body.style.overflow = 'hidden'
      // Trigger animation after render
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before unmounting
      setTimeout(() => {
        setShouldRender(false)
        document.body.style.overflow = 'unset'
      }, 300)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="flex min-h-screen items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Enhanced Backdrop */}
        <div 
          className={cn(
            'fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300',
            isAnimating ? 'opacity-100' : 'opacity-0'
          )}
        />
        
        {/* Enhanced Modal */}
        <div 
          className={cn(
            'relative bg-card rounded-2xl shadow-2xl border border-border/50',
            'transform transition-all duration-300 w-full',
            'backdrop-blur-xl bg-card/95',
            sizeClasses[size],
            isAnimating 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4',
            className
          )}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Enhanced Header */}
          {title && (
            <div className={cn(
              'flex items-center justify-between px-6 py-4 border-b',
              config.headerBg,
              config.headerBorder,
              'rounded-t-2xl'
            )}>
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <div className={cn(
                    'rounded-full p-2',
                    config.headerText.replace('text-', 'bg-').replace('-dark', '/20')
                  )}>
                    <IconComponent className={cn('w-5 h-5', config.headerText)} />
                  </div>
                )}
                <h3 className={cn('text-lg font-semibold', config.headerText)}>
                  {title}
                </h3>
              </div>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    'rounded-full p-2 transition-all duration-200',
                    'hover:bg-text-muted/10 active:bg-text-muted/20 hover:scale-110',
                    config.headerText,
                    'group'
                  )}
                >
                  <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                </button>
              )}
            </div>
          )}
          
          {/* Enhanced Content */}
          <div className={cn(
            'relative',
            title ? 'p-6' : 'p-6',
            size === 'full' && 'max-h-[80vh] overflow-y-auto'
          )}>
            {/* Content background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
            </div>
            
            <div className="relative z-10">
              {children}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
        </div>
      </div>
    </div>
  )
}

export default Modal

// Enhanced Modal Components
interface ModalHeaderProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

export function ModalHeader({ children, className = '', variant = 'default' }: ModalHeaderProps) {
  const variantClasses = {
    default: 'text-text-primary',
    success: 'text-success-dark',
    error: 'text-error-dark',
    warning: 'text-warning-dark',
    info: 'text-accent-dark'
  }

  return (
    <div className={cn('mb-6', variantClasses[variant], className)}>
      {children}
    </div>
  )
}

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={cn('mb-6 text-text-secondary leading-relaxed', className)}>
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function ModalFooter({ children, className = '', align = 'right' }: ModalFooterProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  return (
    <div className={cn(
      'flex items-center gap-3 pt-4 border-t border-border',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  )
}

// Specialized Modal Variants
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const variantConfig = {
    danger: {
      modalVariant: 'error' as const,
      confirmClass: 'bg-error hover:bg-error-dark text-text-inverse',
      icon: XCircle
    },
    warning: {
      modalVariant: 'warning' as const,
      confirmClass: 'bg-warning hover:bg-warning-dark text-text-inverse',
      icon: AlertTriangle
    },
    info: {
      modalVariant: 'info' as const,
      confirmClass: 'bg-accent hover:bg-accent-hover text-text-inverse',
      icon: Info
    }
  }

  const config = variantConfig[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={config.modalVariant}
      size="sm"
    >
      <ModalBody>
        <p className="text-text-secondary">{message}</p>
      </ModalBody>
      
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error disabled:opacity-50 transition-colors',
            config.confirmClass
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Memproses...
            </div>
          ) : (
            confirmText
          )}
        </button>
      </ModalFooter>
    </Modal>
  )
}

