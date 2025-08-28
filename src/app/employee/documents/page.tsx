'use client'

import { useEffect, useState } from 'react'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import FileUpload from '@/components/FileUpload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

type Doc = { id: string; title: string; visibility: 'PUBLIC' | 'PRIVATE'; updatedAt: string }

export default function EmployeeDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [file, setFile] = useState<{ url: string; name: string; size: number; type: string } | null>(null)
  const [form, setForm] = useState({ title: '', description: '', visibility: 'PRIVATE', tags: '' })
  const [tab, setTab] = useState<'mine' | 'shared' | 'public'>('public')
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

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dokumen</h1>
      <div className="flex gap-2">
        <Button variant={tab==='mine'?'primary':'outline'} onClick={() => setTab('mine')}>My Documents</Button>
        <Button variant={tab==='shared'?'primary':'outline'} onClick={() => setTab('shared')}>Shared With Me</Button>
        <Button variant={tab==='public'?'primary':'outline'} onClick={() => setTab('public')}>All Public</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Judul</label>
            <input className="border rounded px-3 py-2 w-full" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Deskripsi</label>
            <textarea className="border rounded px-3 py-2 w-full" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Visibility</label>
            <select className="border rounded px-3 py-2 w-full" value={form.visibility} onChange={e => setForm(s => ({ ...s, visibility: e.target.value }))}>
              <option value="PRIVATE">PRIVATE</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tags</label>
            <input className="border rounded px-3 py-2 w-full" value={form.tags} onChange={e => setForm(s => ({ ...s, tags: e.target.value }))} />
          </div>
          <FileUpload onFileUpload={setFile} onFileRemove={() => setFile(null)} currentFile={file} />
          <Button onClick={handleSubmit} disabled={uploading || !file || !form.title}>{uploading ? 'Mengunggah...' : 'Upload'}</Button>
        </div>
        <div>
          <div className="border rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2">Judul</th>
                  <th className="p-2">Visibility</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={4}>Memuat...</td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={4}>Tidak ada dokumen</td>
                  </tr>
                ) : (
                  docs.map(d => (
                    <tr key={d.id} className="border-t">
                      <td className="p-2">{d.title}</td>
                      <td className="p-2">{d.visibility}</td>
                      <td className="p-2">{new Date(d.updatedAt).toLocaleString()}</td>
                      <td className="p-2 text-right"><a className="text-blue-600 hover:underline" href={`/api/documents/${d.id}/download`}>Download</a></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </EmployeeLayout>
  )
}


