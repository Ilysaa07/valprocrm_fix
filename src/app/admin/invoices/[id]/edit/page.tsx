"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import Button from '@/components/ui/Button'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'

export default function EditInvoicePage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`)
        const data = await res.json()
        setForm({
          issueDate: data.issueDate?.slice(0, 10) || '',
          dueDate: data.dueDate?.slice(0, 10) || '',
          clientName: data.clientName || '',
          clientAddress: data.clientAddress || '',
          clientEmail: data.clientEmail || '',
          clientPhone: data.clientPhone || '',
          notes: data.notes || '',
          taxAmount: data.taxAmount || 0,
          discountAmount: data.discountAmount || 0,
          items: data.items?.map((i: any) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })) || [],
        })
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) load()
  }, [params?.id])

  const updateItem = (id: string, field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      items: prev.items.map((it: any) => {
        if (it.id !== id) return it
        const updated = { ...it, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice)
        }
        return updated
      })
    }))
  }

  const addItem = () => {
    setForm((prev: any) => ({
      ...prev,
      items: [...prev.items, { id: String(Date.now()), description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }))
  }

  const removeItem = (id: string) => {
    setForm((prev: any) => ({
      ...prev,
      items: prev.items.filter((it: any) => it.id !== id)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push(`/admin/invoices/${params.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <AdminLayout>
        <div className="p-6">Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600"><ArrowLeft size={18} /></Button>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
              <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jatuh Tempo</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Klien</label>
              <input type="text" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Klien</label>
              <input type="email" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Klien</label>
              <textarea value={form.clientAddress} onChange={e => setForm({ ...form, clientAddress: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Item</h2>
              <Button type="button" variant="outline" onClick={addItem} className="text-blue-600 border-blue-600"><Plus size={16} className="mr-1"/> Tambah</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2"/>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.items.map((it: any) => (
                    <tr key={it.id}>
                      <td className="px-4 py-2"><input type="text" value={it.description} onChange={e => updateItem(it.id, 'description', e.target.value)} className="w-full px-3 py-2 border rounded" /></td>
                      <td className="px-4 py-2"><input type="number" value={it.quantity} onChange={e => updateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" /></td>
                      <td className="px-4 py-2"><input type="number" value={it.unitPrice} onChange={e => updateItem(it.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" /></td>
                      <td className="px-4 py-2">Rp {it.total.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-2">{form.items.length > 1 && <Button type="button" variant="ghost" onClick={() => removeItem(it.id)} className="text-red-600"><Trash2 size={16}/></Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white"><Save size={16} className="mr-1"/> Simpan</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}







