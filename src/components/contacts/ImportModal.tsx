'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setResults(data.results)
        if (data.results.success > 0) {
          onImportComplete()
        }
      } else {
        setResults({
          success: 0,
          failed: 1,
          errors: [data.error || 'Gagal mengimpor file']
        })
      }
    } catch (error) {
      setResults({
        success: 0,
        failed: 1,
        errors: ['Terjadi kesalahan saat mengimpor file']
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = [
      'Nama Lengkap,Nomor Telepon,WhatsApp,Instagram,Alamat,Perusahaan,Jabatan,Status Klien,Jenis Layanan,Catatan,Tanggal Follow Up',
      'John Doe,08123456789,08123456789,@johndoe,"Jl. Contoh No. 123, Jakarta",PT Contoh,Direktur,PROSPECT,Pendirian PT,Klien potensial untuk pendirian PT,2024-02-01',
      'Jane Smith,08987654321,08987654321,@janesmith,"Jl. Sample No. 456, Bandung",CV Sample,Manager,ACTIVE,Trademark,Sedang proses trademark,2024-02-15'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import-kontak.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleClose = () => {
    setFile(null)
    setResults(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import Kontak
            </h2>
            <Button variant="outline" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!results ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Petunjuk Import
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• File harus berformat CSV atau Excel (.xlsx)</li>
                      <li>• Maksimal ukuran file 5MB</li>
                      <li>• Kolom "Nama Lengkap" wajib diisi</li>
                      <li>• Nomor telepon/WhatsApp tidak boleh duplikat</li>
                      <li>• Download template untuk format yang benar</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template CSV
                </Button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="mb-4">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        Pilih file
                      </span>
                      <span className="text-gray-600 dark:text-gray-300"> atau drag & drop</span>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    CSV, Excel hingga 5MB
                  </p>
                </div>
              </div>

              {/* Selected File */}
              {file && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  loading={uploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Mengimpor...' : 'Import Kontak'}
                </Button>
              </div>
            </div>
          ) : (
            /* Results */
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  results.success > 0 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {results.success > 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Import Selesai
                </h3>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {results.success}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Berhasil
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {results.failed}
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Gagal
                  </p>
                </div>
              </div>

              {/* Errors */}
              {results.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Error Details:
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button onClick={handleClose}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
