'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import FileUpload from '@/components/FileUpload'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { DocumentEmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/providers/ToastProvider'
import DocumentAnalytics from '@/components/DocumentAnalytics'
import AdvancedDocumentSearch from '@/components/AdvancedDocumentSearch'
import { 
  FileText, 
  Upload, 
  Grid3X3, 
  List, 
  Search, 
  Filter, 
  X, 
  Eye, 
  Download, 
  RefreshCw, 
  Share2, 
  Archive, 
  FolderOpen, 
  Tag, 
  User, 
  Calendar,
  HardDrive,
  Globe,
  Lock,
  BarChart3,
  TrendingUp,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Folder
} from 'lucide-react'
import Link from 'next/link'

type Doc = {
  id: string
  title: string
  description?: string
  visibility: 'PUBLIC' | 'PRIVATE'
  sizeBytes: number
  mimeType: string
  createdAt: string
  updatedAt: string
  isArchived?: boolean
  tags?: Array<{ id: string; name: string }>
  folder?: { id: string; name: string } | null
  owner?: { id: string; fullName: string; email: string }
  _count?: { downloadLogs: number; versions: number }
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<{ url: string; name: string; size: number; type: string } | null>(null)
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    visibility: 'PRIVATE', 
    tags: ''
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [filterVisibility, setFilterVisibility] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL')
  const [filterFolderId, setFilterFolderId] = useState<string>('')
  const [filterTag, setFilterTag] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents' | 'analytics' | 'search'>('documents')
  const { showToast } = useToast()
  const [versionForDocId, setVersionForDocId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const sp: string[] = []
      if (filterVisibility !== 'ALL') sp.push(`visibility=${filterVisibility}`)
      if (filterFolderId) sp.push(`folderId=${encodeURIComponent(filterFolderId)}`)
      if (filterTag) sp.push(`tag=${encodeURIComponent(filterTag)}`)
      const qs = sp.length ? `?${sp.join('&')}` : ''
      const res = await fetch('/api/documents' + qs, { cache: 'no-store' })
      if (!res.ok) {
        let message = `Gagal memuat dokumen (${res.status})`
        try {
          const d = await res.json()
          if (d?.error) message = d.error
        } catch {}
        showToast(message, { title: 'Error', type: 'error' })
        setDocs([])
        return
      }
      const data = await res.json()
      setDocs(data.data || [])
    } catch (err) {
      showToast('Terjadi kesalahan saat memuat dokumen', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterVisibility, filterFolderId, filterTag])

  // Removed folder loading

  const handleSubmit = async () => {
    if (!file || !form.title) return
    setUploading(true)
    const fd = new FormData()
    const blob = await fetch(file.url).then(r => r.blob())
    const name = file.name
    fd.append('file', blob, name)
    fd.append('title', form.title)
    if (form.description) fd.append('description', form.description)
    if (form.tags) fd.append('tags', form.tags)
    fd.append('visibility', form.visibility)
    try {
      const res = await fetch('/api/documents', { method: 'POST', body: fd })
      if (res.ok) {
        setFile(null)
        setForm({ title: '', description: '', visibility: 'PRIVATE', tags: '' })
        setShowUploadForm(false)
        showToast('Dokumen berhasil diunggah', { title: 'Sukses', type: 'success' })
        await load()
      } else {
        let message = 'Upload gagal'
        try {
          const d = await res.json()
          if (d?.error) message = d.error
        } catch {
          try {
            const t = await res.text()
            if (t) message = t
          } catch {}
        }
        showToast(message, { title: 'Error', type: 'error' })
      }
    } catch (e) {
      showToast('Tidak dapat mengunggah sekarang. Coba lagi.', { title: 'Error', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const displayedDocs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(d => 
      d.title.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.tags && d.tags.some(t => t.name.toLowerCase().includes(q)))
    )
  }, [docs, search])

  const formatBytes = (num: number) => {
    if (!num && num !== 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let n = num
    let i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />
    if (mimeType.includes('word')) return <FileText className="w-6 h-6 text-blue-500" />
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-6 h-6 text-green-500" />
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FileText className="w-6 h-6 text-orange-500" />
    if (mimeType.includes('image')) return <FileImage className="w-6 h-6 text-purple-500" />
    return <File className="w-6 h-6 text-gray-500" />
  }

  const previewDoc = (d: Doc) => {
    window.open(`/api/documents/${d.id}/download?inline=1`, '_blank')
  }

  const downloadDoc = (d: Doc) => {
    window.open(`/api/documents/${d.id}/download`, '_blank')
  }

  const archiveDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        let message = 'Gagal mengarsipkan dokumen'
        try { const d = await res.json(); if (d?.error) message = d.error } catch {}
        showToast(message, { title: 'Error', type: 'error' })
        return
      }
      showToast('Dokumen diarsipkan', { title: 'Sukses', type: 'success' })
      await load()
    } catch {
      showToast('Gagal mengarsipkan dokumen', { title: 'Error', type: 'error' })
    }
  }

  const shareToRole = async (id: string, role: 'EMPLOYEE' | 'CLIENT') => {
    try {
      const res = await fetch(`/api/documents/${id}/acl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, canView: true })
      })
      if (!res.ok) {
        let message = 'Gagal membagikan dokumen'
        try { const d = await res.json(); if (d?.error) message = d.error } catch {}
        showToast(message, { title: 'Error', type: 'error' })
        return
      }
      showToast('Akses dibagikan', { title: 'Sukses', type: 'success' })
    } catch {
      showToast('Gagal membagikan dokumen', { title: 'Error', type: 'error' })
    }
  }

  const handlePickVersion = (docId: string) => {
    setVersionForDocId(docId)
    const input = document.getElementById('version-file-input') as HTMLInputElement | null
    input?.click()
  }

  const onVersionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    const docId = versionForDocId
    setVersionForDocId(null)
    e.target.value = ''
    if (!f || !docId) return
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch(`/api/documents/${docId}/versions`, { method: 'POST', body: fd })
      if (!res.ok) {
        let message = 'Gagal mengunggah versi baru'
        try { const d = await res.json(); if (d?.error) message = d.error } catch {}
        showToast(message, { title: 'Error', type: 'error' })
        return
      }
      showToast('Versi baru berhasil diunggah', { title: 'Sukses', type: 'success' })
      await load()
    } catch {
      showToast('Gagal mengunggah versi baru', { title: 'Error', type: 'error' })
    }
  }

  const stats = useMemo(() => {
    const total = docs.length
    const publicDocs = docs.filter(d => d.visibility === 'PUBLIC').length
    const privateDocs = docs.filter(d => d.visibility === 'PRIVATE').length
    const totalSize = docs.reduce((sum, d) => sum + d.sizeBytes, 0)
    const totalDownloads = docs.reduce((sum, d) => sum + (d._count?.downloadLogs || 0), 0)

    return { total, publicDocs, privateDocs, totalSize, totalDownloads }
  }, [docs])

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#121212] min-h-screen transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Dokumen
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola dan atur dokumen perusahaan</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/folders">
              <Button 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                Kelola Folder
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {viewMode === 'grid' ? (
                <>
                  <List className="w-4 h-4" />
                  List
                </>
              ) : (
                <>
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </>
              )}
            </Button>
            <Button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Dokumen
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Dokumen
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Advanced Search
            </button>
          </nav>
        </div>

        {/* Stats Cards - Only show for documents tab */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 stats-card hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 file-icon" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Dokumen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 stats-card hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Globe className="w-6 h-6 text-green-600 dark:text-green-400 file-icon" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Public</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publicDocs}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 stats-card hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <Lock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 file-icon" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Private</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.privateDocs}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 stats-card hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400 file-icon" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatBytes(stats.totalSize)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 stats-card hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <Download className="w-6 h-6 text-red-600 dark:text-red-400 file-icon" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Downloads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'documents' ? (
          <>
            {/* Search and Filters */}
            <Card className="p-4 card-hover bg-white dark:bg-gray-800">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    placeholder="Cari dokumen..."
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors search-input"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={filterVisibility}
                    onChange={e => setFilterVisibility(e.target.value as any)}
                  >
                    <option value="ALL">Semua Visibility</option>
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                  {/* Folder filter removed */}
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      placeholder="Filter tag"
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={filterTag}
                      onChange={e => setFilterTag(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Upload Form */}
            {showUploadForm && (
              <Card className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 slide-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Upload Dokumen Baru
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setShowUploadForm(false)} className="btn-hover">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Dokumen</label>
                      <input 
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring" 
                        value={form.title} 
                        onChange={e => setForm(s => ({ ...s, title: e.target.value }))} 
                        placeholder="Masukkan judul dokumen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                      <textarea 
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring" 
                        value={form.description} 
                        onChange={e => setForm(s => ({ ...s, description: e.target.value }))} 
                        placeholder="Deskripsi dokumen (opsional)"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                        <input 
                          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring" 
                          value={form.tags} 
                          onChange={e => setForm(s => ({ ...s, tags: e.target.value }))} 
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                      <select 
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring" 
                        value={form.visibility} 
                        onChange={e => setForm(s => ({ ...s, visibility: e.target.value }))}
                      >
                        <option value="PRIVATE">🔒 Private</option>
                        <option value="PUBLIC">🌐 Public</option>
                      </select>
                    </div>
                    {/* Folder selection removed */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File</label>
                      <FileUpload onFileUpload={setFile} onFileRemove={() => setFile(null)} currentFile={file} />
                    </div>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={uploading || !file || !form.title}
                      className="w-full flex items-center justify-center gap-2 btn-hover active-scale"
                      loading={uploading}
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Dokumen
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Documents Display */}
            {loading ? (
              <Card className="p-8">
                <div className="text-center">
                  <LoadingSpinner size="xl" variant="primary" className="mx-auto" />
                  <p className="mt-4 text-gray-600 dark:text-gray-300">Memuat dokumen...</p>
                </div>
              </Card>
            ) : displayedDocs.length === 0 ? (
              <Card className="p-8">
                <DocumentEmptyState 
                  onUpload={() => setShowUploadForm(true)}
                />
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
                {displayedDocs.map((d, index) => {
                  if (viewMode === 'grid') {
                    return (
                      <Card key={d.id} className="p-4 doc-grid-item hover:shadow-lg transition-all duration-200 group fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="file-icon">
                            {getFileIcon(d.mimeType)}
                          </div>
                          <Badge variant={d.visibility === 'PUBLIC' ? 'success' : 'secondary'}>
                            {d.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2" title={d.title}>
                          {d.title}
                        </h3>
                        
                        {d.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2" title={d.description}>
                            {d.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Ukuran:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatBytes(d.sizeBytes)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Downloads:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{d._count?.downloadLogs ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Versi:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{d._count?.versions ?? 1}</span>
                          </div>
                        </div>
                        
                        {d.tags && d.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {d.tags.slice(0, 3).map(tag => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                #{tag.name}
                              </Badge>
                            ))}
                            {d.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{d.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {d.owner?.fullName || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(d.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => previewDoc(d)} className="flex-1 flex items-center justify-center gap-1 btn-hover">
                            <Eye className="w-3 h-3" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadDoc(d)} className="flex-1 flex items-center justify-center gap-1 btn-hover">
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                        
                        <div className="flex gap-1 mt-2">
                          <Button variant="outline" size="sm" onClick={() => handlePickVersion(d.id)} className="flex-1 text-xs flex items-center justify-center gap-1 btn-hover">
                            <RefreshCw className="w-3 h-3" />
                            Versi
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => shareToRole(d.id, 'EMPLOYEE')} className="flex-1 text-xs flex items-center justify-center gap-1 btn-hover">
                            <Share2 className="w-3 h-3" />
                            Share
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => archiveDoc(d.id)} className="flex-1 text-xs flex items-center justify-center gap-1 btn-hover">
                            <Archive className="w-3 h-3" />
                            Archive
                          </Button>
                        </div>
                      </Card>
                    )
                  } else {
                    return (
                      <Card key={d.id} className="p-4 hover:shadow-md transition-shadow doc-grid-item fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                        <div className="flex items-center gap-4">
                          <div className="file-icon">
                            {getFileIcon(d.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{d.title}</h3>
                              <Badge variant={d.visibility === 'PUBLIC' ? 'success' : 'secondary'}>
                                {d.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
                              </Badge>
                            </div>
                            {d.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{d.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <span>{formatBytes(d.sizeBytes)}</span>
                              <span>•</span>
                              <span>{d._count?.downloadLogs ?? 0} downloads</span>
                              <span>•</span>
                              <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => previewDoc(d)} className="flex items-center gap-1 btn-hover">
                              <Eye className="w-3 h-3" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadDoc(d)} className="flex items-center gap-1 btn-hover">
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handlePickVersion(d.id)} className="flex items-center gap-1 btn-hover">
                              <RefreshCw className="w-3 h-3" />
                              Versi
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareToRole(d.id, 'EMPLOYEE')} className="flex items-center gap-1 btn-hover">
                              <Share2 className="w-3 h-3" />
                              Share
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => archiveDoc(d.id)} className="flex items-center gap-1 btn-hover">
                              <Archive className="w-3 h-3" />
                              Archive
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  }
                })}
              </div>
            )}

          </>
        ) : activeTab === 'analytics' ? (
          <DocumentAnalytics />
        ) : (
          <AdvancedDocumentSearch />
        )}

        {/* Hidden input for version upload */}
        <input id="version-file-input" type="file" className="hidden" onChange={onVersionFileChange} />
      </div>
    </AdminLayout>
  )
}


