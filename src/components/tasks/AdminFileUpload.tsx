'use client'

import { useState, useRef } from 'react'
import { showError } from '@/lib/swal'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'

interface AdminFileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFileSize?: number // in MB
  maxTotalSize?: number // in MB
  allowedTypes?: string[]
  disabled?: boolean
  className?: string
}

export default function AdminFileUpload({
  files,
  onFilesChange,
  maxFileSize = 10,
  maxTotalSize = 100, // Admin bisa upload lebih banyak
  allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain'
  ],
  disabled = false,
  className = ''
}: AdminFileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" terlalu besar. Maksimal ${maxFileSize}MB per file`
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Tipe file "${file.name}" tidak didukung`
    }

    return null
  }

  const handleFiles = (newFiles: File[]) => {
    // Validate each file
    const errors: string[] = []
    const validFiles: File[] = []

    for (const file of newFiles) {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    }

    if (errors.length > 0) {
      showError("Validasi File", errors.join('\n'))
    }

    if (validFiles.length > 0) {
      // Check total size
      const currentTotalSize = files.reduce((sum, file) => sum + file.size, 0)
      const newTotalSize = validFiles.reduce((sum, file) => sum + file.size, 0)
      const totalSize = currentTotalSize + newTotalSize

      if (totalSize > maxTotalSize * 1024 * 1024) {
        showError("Batas Ukuran", `Total ukuran file terlalu besar. Maksimal ${maxTotalSize}MB untuk semua file`)
        return
      }

      onFilesChange([...files, ...validFiles])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type === 'application/pdf') return '📄'
    if (file.type.includes('word') || file.type.includes('document')) return '📝'
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊'
    if (file.type.includes('zip')) return '📦'
    return '📁'
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
          accept={allowedTypes.join(',')}
        />
        
        <div className="space-y-2">
          <Upload className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Klik untuk memilih file</span> atau drag & drop
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {maxFileSize}MB per file, total {maxTotalSize}MB (Admin - Tanpa batas jumlah file)
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              File Terpilih ({files.length})
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {formatFileSize(totalSize)} / {maxTotalSize}MB
            </span>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(file)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supported Formats */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <div className="font-medium mb-1">Format yang didukung:</div>
        <div className="flex flex-wrap gap-1">
          {['PNG', 'JPG', 'GIF', 'WEBP', 'PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'ZIP', 'TXT'].map(format => (
            <span key={format} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
