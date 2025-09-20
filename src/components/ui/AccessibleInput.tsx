'use client'

import React, { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  showPasswordToggle?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    className,
    label,
    error,
    helperText,
    showPasswordToggle = false,
    leftIcon,
    rightIcon,
    type = 'text',
    id,
    required,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperTextId = helperText ? `${inputId}-helper` : undefined
    
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type

    const hasError = Boolean(error)
    const hasLeftIcon = Boolean(leftIcon)
    const hasRightIcon = Boolean(rightIcon) || showPasswordToggle

    const inputClasses = cn(
      'w-full rounded-lg border transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-text-muted',
      // Base styling
      'bg-surface text-text-primary',
      // Padding adjustments for icons
      hasLeftIcon ? 'pl-10' : 'pl-3',
      hasRightIcon ? 'pr-10' : 'pr-3',
      'py-2.5',
      // Border and focus states
      hasError 
        ? 'border-error focus:border-error focus:ring-error/20' 
        : 'border-border focus:border-accent focus:ring-accent/20',
      // Hover state
      !disabled && !hasError && 'hover:border-border-hover',
      className
    )

    const containerClasses = cn(
      'relative',
      disabled && 'opacity-50'
    )

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium transition-colors duration-200',
              hasError ? 'text-error' : 'text-text-primary',
              required && "after:content-['*'] after:ml-0.5 after:text-error"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className={containerClasses}>
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={cn(
              errorId && errorId,
              helperTextId && helperTextId
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(rightIcon || showPasswordToggle) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showPasswordToggle && type === 'password' ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text-secondary transition-colors duration-200 focus:outline-none focus:text-text-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="text-text-muted">
                  {rightIcon}
                </div>
              )}
            </div>
          )}

          {/* Focus Ring Indicator */}
          {isFocused && (
            <div 
              className={cn(
                'absolute inset-0 rounded-lg pointer-events-none',
                'ring-2 ring-offset-1',
                hasError ? 'ring-error/20' : 'ring-accent/20'
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div 
            id={errorId}
            className="flex items-center space-x-1 text-sm text-error"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <div 
            id={helperTextId}
            className="text-sm text-text-muted"
          >
            {helperText}
          </div>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = 'AccessibleInput'

export default AccessibleInput

