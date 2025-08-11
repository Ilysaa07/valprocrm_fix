'use client'

import { useState, useRef } from 'react'
import { Upload, File, X, CheckCircle } from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (fileData: {
    url: string
    name: string
    size: number
    type: string
  }) => void
  onFileRemove: () => void
  currentFile?: {
    url: string
    name: string
    size: number
  } | null
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
}

export default function FileUpload({
  onFileUpload,
  onFileRemove,
  currentFile,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSize = 10,
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = async (file: File) => {
    if (disabled) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Ukuran file terlalu besar. Maksimal ${maxSize}MB.`)
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Tipe file tidak didukung. Hanya PDF, DOC, DOCX, JPG, JPEG, dan PNG yang diperbolehkan.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        onFileUpload(data.file)
      } else {
        alert(data.error || 'Gagal mengupload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Terjadi kesalahan saat mengupload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveFile = () => {
    onFileRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (currentFile) {
    return (
      <div className="border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(currentFile.size)}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex-shrink-0 ml-4 text-red-400 hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragOver
          ? 'border-blue-400 bg-blue-50'
          : disabled
          ? 'border-gray-200 bg-gray-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-sm text-gray-600">Mengupload file...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className={`h-8 w-8 mb-2 ${disabled ? 'text-gray-400' : 'text-gray-400'}`} />
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
            {disabled ? 'Upload dinonaktifkan' : 'Drag & drop file atau'}
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              pilih file
            </button>
          )}
          <p className="text-xs text-gray-500 mt-2">
            PDF, DOC, DOCX, JPG, PNG (max {maxSize}MB)
          </p>
        </div>
      )}
    </div>
  )
}

