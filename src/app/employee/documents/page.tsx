'use client'

import { useEffect, useMemo, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import FileUpload from '@/components/FileUpload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'
import { 
  FileText, Upload, Grid3X3, List, Search, X, Eye, Download,
  Globe, Lock, File as FileIcon, FileImage, FileSpreadsheet, Tag, Calendar, User, RefreshCw
} from 'lucide-react'

type Doc = { id: string; title: string; description?: string; visibility: 'PUBLIC' | 'PRIVATE'; updatedAt: string; sizeBytes?: number; mimeType?: string; owner?: { id: string; fullName: string }; _count?: { downloadLogs: number; versions: number } }

export default function EmployeeDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [file, setFile] = useState<{ url: string; name: string; size: number; type: string } | null>(null)
  const [form, setForm] = useState({ title: '', description: '', visibility: 'PRIVATE', tags: '' })
  const [tab, setTab] = useState<'mine' | 'shared' | 'public'>('public')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const { showToast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const qs = tab === 'mine' ? '?mine=true' : tab === 'shared' ? '?shared=true' : '?visibility=PUBLIC'
      const res = await fetch('/api/documents' + qs, { cache: 'no-store' })
      if (!res.ok) {
        let message = `Gagal memuat dokumen (${res.status})`
        try {
          const d = await res.json(); if (d?.error) message = d.error
        } catch {}
        showToast(message, { title: 'Error', type: 'error' })
        setDocs([])
        return
      }
      const data = await res.json()
      setDocs(data.data || [])
    } catch (e) {
      showToast('Terjadi kesalahan saat memuat dokumen', { title: 'Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [tab])

  const handleSubmit = async () => {
    if (!file || !form.title) return
    setUploading(true)
    const fd = new FormData()
    const blob = await fetch(file.url).then(r => r.blob())
    fd.append('file', new File([blob], file.name, { type: file.type }))
    fd.append('title', form.title)
    if (form.description) fd.append('description', form.description)
    if (form.tags) fd.append('tags', form.tags)
    fd.append('visibility', form.visibility)
    try {
      const res = await fetch('/api/documents', { method: 'POST', body: fd })
      if (res.ok) {
        setFile(null)
        setForm({ title: '', description: '', visibility: 'PRIVATE', tags: '' })
        showToast('Dokumen berhasil diunggah', { title: 'Sukses', type: 'success' })
        await load()
      } else {
        let message = 'Upload gagal'
        try {
          const d = await res.json(); if (d?.error) message = d.error
        } catch {
          try { const t = await res.text(); if (t) message = t } catch {}
        }
        showToast(message, { title: 'Error', type: 'error' })
      }
    } catch (e) {
      showToast('Tidak dapat mengunggah sekarang. Coba lagi.', { title: 'Error', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const formatBytes = (num?: number) => {
    if (!num && num !== 0) return '-'
    const units = ['B','KB','MB','GB']
    let n = num
    let i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  const getFileIcon = (mime?: string) => {
    const m = mime || ''
    if (m.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />
    if (m.includes('word')) return <FileText className="w-6 h-6 text-blue-500" />
    if (m.includes('excel') || m.includes('spreadsheet')) return <FileSpreadsheet className="w-6 h-6 text-green-500" />
    if (m.includes('image')) return <FileImage className="w-6 h-6 text-purple-500" />
    return <FileIcon className="w-6 h-6 text-gray-500" />
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(d => d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q))
  }, [docs, search])

  const previewDoc = (d: Doc) => window.open(`/api/documents/${d.id}/download?inline=1`, '_blank')
  const downloadDoc = (d: Doc) => window.open(`/api/documents/${d.id}/download`, '_blank')

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dokumen</h1>
            <p className="text-gray-600 mt-1">Akses cepat dokumen anda (Public/Shared/Mine)</p>
          </div>
      <div className="flex gap-2">
        <Button variant={tab==='mine'?'primary':'outline'} onClick={() => setTab('mine')}>My Documents</Button>
            <Button variant={tab==='shared'?'primary':'outline'} onClick={() => setTab('shared')}>Shared</Button>
            <Button variant={tab==='public'?'primary':'outline'} onClick={() => setTab('public')}>Public</Button>
            <Button variant="outline" onClick={() => setViewMode(viewMode==='grid'?'list':'grid')} className="flex items-center gap-1">
              {viewMode==='grid'? (<><List className="w-4 h-4"/>List</>):(<><Grid3X3 className="w-4 h-4"/>Grid</>)}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari judul/desk..." className="w-full border rounded-lg pl-10 pr-3 py-2"/>
            </div>
            <Button onClick={()=>load()} variant="outline" className="flex items-center gap-1"><RefreshCw className="w-4 h-4"/>Refresh</Button>
          </div>
        </Card>

        {/* Upload */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <input className="border rounded px-3 py-2 w-full" placeholder="Judul" value={form.title} onChange={e=>setForm(s=>({...s,title:e.target.value}))}/>
              <textarea className="border rounded px-3 py-2 w-full" placeholder="Deskripsi (opsional)" rows={3} value={form.description} onChange={e=>setForm(s=>({...s,description:e.target.value}))}/>
              <div className="flex gap-2">
                <select className="border rounded px-3 py-2" value={form.visibility} onChange={e=>setForm(s=>({...s,visibility:e.target.value}))}>
                  <option value="PRIVATE">🔒 Private</option>
                  <option value="PUBLIC">🌐 Public</option>
                </select>
                <input className="border rounded px-3 py-2 flex-1" placeholder="tag1, tag2" value={form.tags} onChange={e=>setForm(s=>({...s,tags:e.target.value}))}/>
              </div>
              <div className="text-xs text-gray-500">Format didukung: PDF, DOCX, XLSX, CSV, ZIP, Images</div>
      </div>
        <div className="space-y-3">
              <FileUpload onFileUpload={setFile} onFileRemove={()=>setFile(null)} currentFile={file}/>
              <Button onClick={handleSubmit} disabled={uploading||!file||!form.title} className="w-full">{uploading?'Mengunggah...':'Upload'}</Button>
            </div>
          </div>
        </Card>

        {/* List */}
        {loading ? (
          <Card className="p-8 text-center">
            <LoadingSpinner className="mx-auto"/>
            <p className="mt-2 text-gray-500">Memuat...</p>
          </Card>
        ) : filtered.length===0 ? (
          <Card className="p-8 text-center text-gray-500">Tidak ada dokumen</Card>
        ) : viewMode==='grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => (
              <Card key={d.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>{getFileIcon(d.mimeType)}</div>
                  <Badge variant={d.visibility==='PUBLIC'?'success':'secondary'}>{d.visibility}</Badge>
          </div>
                <h3 className="font-semibold line-clamp-2" title={d.title}>{d.title}</h3>
                {d.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{d.description}</p>}
                <div className="text-xs text-gray-500 flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1"><User className="w-3 h-3"/>{d.owner?.fullName||'Unknown'}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(d.updatedAt).toLocaleDateString()}</span>
          </div>
                <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                  <span>{formatBytes(d.sizeBytes)}</span>
                  <span>{d._count?.versions??1} versi</span>
          </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={()=>previewDoc(d)} className="flex-1">Preview</Button>
                  <Button variant="outline" size="sm" onClick={()=>downloadDoc(d)} className="flex-1">Download</Button>
          </div>
              </Card>
            ))}
        </div>
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Judul</th>
                  <th className="p-3 text-left">Visibility</th>
                  <th className="p-3 text-left">Ukuran</th>
                  <th className="p-3 text-left">Update</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                    <tr key={d.id} className="border-t">
                    <td className="p-3">{d.title}</td>
                    <td className="p-3">{d.visibility}</td>
                    <td className="p-3">{formatBytes(d.sizeBytes)}</td>
                    <td className="p-3">{new Date(d.updatedAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm" onClick={()=>previewDoc(d)} className="mr-2">Preview</Button>
                      <Button variant="outline" size="sm" onClick={()=>downloadDoc(d)}>Download</Button>
                    </td>
                    </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  )
}


