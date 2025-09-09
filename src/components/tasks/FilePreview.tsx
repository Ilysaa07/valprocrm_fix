'use client'

import { useState } from 'react'
import { X, FileText, Eye, Download, Image, File } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FilePreviewProps {
  fileUrl: string
  fileName: string
  fileType?: string
  fileSize?: number
}

export default function FilePreview({ fileUrl, fileName, fileType }: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  const isImage = fileType?.startsWith('image/') || 
                 fileName.toLowerCase().includes('.jpg') || 
                 fileName.toLowerCase().includes('.jpeg') || 
                 fileName.toLowerCase().includes('.png') || 
                 fileName.toLowerCase().includes('.gif') ||
                 fileName.toLowerCase().includes('.webp')
  
  const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().includes('.pdf')
  const isDocument = fileType?.includes('word') || 
                    fileType?.includes('document') || 
                    fileName.toLowerCase().includes('.doc') || 
                    fileName.toLowerCase().includes('.docx')

  const getFileIcon = () => {
    if (isImage) return <Image className="w-5 h-5 text-green-500" />
    if (isPDF) return <FileText className="w-5 h-5 text-red-500" />
    if (isDocument) return <FileText className="w-5 h-5 text-blue-500" />
    return <FileText className="w-5 h-5 text-gray-500" />
  }

  const getFileTypeText = () => {
    if (isImage) return 'Image'
    if (isPDF) return 'PDF Document'
    if (isDocument) return 'Word Document'
    return 'File'
  }

  const handlePreview = () => {
    if (isImage) {
      setShowPreview(true)
    } else if (isPDF) {
      // Open PDF in new tab
      window.open(fileUrl, '_blank')
    } else {
      // Download other file types
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{fileName}</p>
            <p className="text-xs text-gray-500">{getFileTypeText()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isImage && (
            <Button
              onClick={handlePreview}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}
          
          {isPDF && (
            <Button
              onClick={handlePreview}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              View PDF
            </Button>
          )}
          
          <Button
            onClick={handleDownload}
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-700"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showPreview && isImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <div className="relative">
              <Button
                onClick={() => setShowPreview(false)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 z-10"
              >
                <X className="w-5 h-5" />
              </Button>
              <img 
                src={fileUrl} 
                alt={fileName}
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  console.error('Error loading image:', e)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
