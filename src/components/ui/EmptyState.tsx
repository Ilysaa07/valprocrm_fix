'use client'

import { ReactNode } from 'react'
import Button from './Button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
    icon?: ReactNode
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  }

  const iconSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  }

  return (
    <div className={cn(
      'text-center',
      sizeClasses[size],
      className || ''
    )}>
      {icon && (
        <div className={cn(
          'mx-auto text-gray-300 mb-4',
          iconSizeClasses[size]
        )}>
          {icon}
        </div>
      )}
      
      <h3 className={cn(
        'font-medium text-gray-900 mb-2',
        size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl'
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-gray-600 mb-6',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="flex items-center gap-2 mx-auto"
        >
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Specific empty state variants
export function DocumentEmptyState({ 
  onUpload, 
  className 
}: { 
  onUpload: () => void
  className?: string 
}) {
  return (
          <EmptyState
        icon={<DocumentIcon />}
        title="Tidak ada dokumen"
        description="Mulai dengan mengunggah dokumen pertama Anda"
        action={{
          label: "Upload Dokumen",
          onClick: onUpload,
          icon: <UploadIcon />
        }}
        className={className || ''}
      />
  )
}

export function SearchEmptyState({ 
  onClearFilters, 
  className 
}: { 
  onClearFilters: () => void
  className?: string 
}) {
  return (
          <EmptyState
        icon={<SearchIcon />}
        title="Tidak ada hasil ditemukan"
        description="Coba ubah filter pencarian Anda"
        action={{
          label: "Clear Filters",
          onClick: onClearFilters,
          variant: "outline",
          icon: <ClearIcon />
        }}
        className={className || ''}
        size="md"
      />
  )
}

export function VersionEmptyState({ 
  onUpload, 
  className 
}: { 
  onUpload: () => void
  className?: string 
}) {
  return (
          <EmptyState
        icon={<HistoryIcon />}
        title="Belum ada versi dokumen"
        description="Upload versi pertama untuk memulai"
        action={{
          label: "Upload Versi",
          onClick: onUpload,
          icon: <UploadIcon />
        }}
        className={className || ''}
        size="sm"
      />
  )
}

// Icon components
function DocumentIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}
