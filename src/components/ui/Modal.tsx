'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  className = ''
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div 
          className={`
            relative bg-white rounded-xl shadow-xl 
            transform transition-all duration-300 w-full
            ${sizeClasses[size]}
            ${className}
          `}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className={title ? 'p-6' : 'p-6'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal

interface ModalHeaderProps {
  children: ReactNode
  className?: string
}

export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
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
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex justify-end space-x-3 ${className}`}>
      {children}
    </div>
  )
}

