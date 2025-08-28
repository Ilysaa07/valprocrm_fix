'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { VersionEmptyState } from '@/components/ui/EmptyState'
import { 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  Presentation,
  FileCode,
  Upload,
  X,
  Eye,
  Download,
  RefreshCw,
  History,
  GitCompare,
  User,
  Calendar,
  HardDrive
} from 'lucide-react'

type DocumentVersion = {
  id: string
  version: number
  fileUrl: string
  uploadedAt: string
  uploadedBy: string
  user?: {
    fullName: string
    email: string
  }
}

type DocumentVersionManagerProps = {
  documentId: string
  documentTitle: string
  onVersionAdded?: () => void
}

export default function DocumentVersionManager({ 
  documentId, 
  documentTitle, 
  onVersionAdded 
}: DocumentVersionManagerProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadVersions()
  }, [documentId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.data.versions || [])
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
      showToast('Gagal memuat versi dokumen', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadNewVersion = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        showToast('Versi baru berhasil diunggah', { title: 'Sukses', type: 'success' })
        setSelectedFile(null)
        setShowUpload(false)
        await loadVersions()
        onVersionAdded?.()
      } else {
        const error = await response.json()
        showToast(error.error || 'Gagal mengunggah versi baru', { title: 'Error', type: 'error' })
      }
    } catch (error) {
      showToast('Terjadi kesalahan saat mengunggah', { title: 'Error', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const downloadVersion = (version: DocumentVersion) => {
    window.open(`/api/documents/${documentId}/versions/${version.id}/download`, '_blank')
  }

  const previewVersion = (version: DocumentVersion) => {
    window.open(`/api/documents/${documentId}/versions/${version.id}/download?inline=1`, '_blank')
  }

  const formatBytes = (num: number) => {
    if (!num && num !== 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let n = num
    let i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-5 h-5 text-blue-500" />
    if (ext === 'xls' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-green-500" />
    if (ext === 'ppt' || ext === 'pptx') return <Presentation className="w-5 h-5 text-orange-500" />
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <FileImage className="w-5 h-5 text-purple-500" />
    return <FileCode className="w-5 h-5 text-gray-500" />
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat versi dokumen...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Versi Dokumen
          </h3>
          <p className="text-sm text-gray-600">{documentTitle}</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} variant="outline" className="flex items-center gap-2 btn-hover">
          {showUpload ? (
            <>
              <X className="w-4 h-4" />
              Batal
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Upload Versi Baru
            </>
          )}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="p-6 border-2 border-dashed border-blue-300 bg-blue-50 slide-in">
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-400 mx-auto file-icon" />
              <h4 className="mt-2 text-lg font-medium text-gray-900">Upload Versi Baru</h4>
              <p className="text-sm text-gray-600">
                Pilih file untuk membuat versi baru dari dokumen ini
              </p>
            </div>

            <div className="flex items-center justify-center">
              <input
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border fade-in">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  onClick={uploadNewVersion}
                  loading={uploading}
                  disabled={!selectedFile}
                  className="flex items-center gap-2 btn-hover active-scale"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Versi
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Versions List */}
      <Card className="p-6 hover:shadow-md transition-shadow card-hover">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          Riwayat Versi
        </h4>
        
        {versions.length === 0 ? (
          <VersionEmptyState 
            onUpload={() => setShowUpload(true)}
          />
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors fade-in ${
                  index === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="file-icon">
                      {getFileIcon(version.fileUrl)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          Versi {version.version}
                        </span>
                        {index === 0 && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(version.uploadedAt).toLocaleString()}
                      </p>
                      {version.user && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          oleh {version.user.fullName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewVersion(version)}
                    className="flex items-center gap-1 btn-hover"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadVersion(version)}
                    className="flex items-center gap-1 btn-hover"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Version Comparison */}
      {versions.length > 1 && (
        <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            Bandingkan Versi
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versi Pertama
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring">
                {versions.map(version => (
                  <option key={version.id} value={version.id}>
                    Versi {version.version} - {new Date(version.uploadedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versi Kedua
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring">
                {versions.map(version => (
                  <option key={version.id} value={version.id}>
                    Versi {version.version} - {new Date(version.uploadedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 btn-hover">
              <Compare className="w-4 h-4" />
              Bandingkan Versi
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
