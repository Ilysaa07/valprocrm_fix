"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { FileText, Download, Edit, ArrowLeft, CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function InvoiceDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; total: number }
  interface Invoice {
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    clientName: string
    clientEmail?: string
    clientPhone?: string
    status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL'
    paidAmount?: number
    grandTotal: number
    items: InvoiceItem[]
  }
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState<'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL'>('UNPAID')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`)
        if (!res.ok) {
          throw new Error('Failed to load invoice')
        }
        const data = await res.json()
        setInvoice(data)
        setNewStatus(data.status)
        setPaidAmount(Number(data.paidAmount || 0))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) load()
  }, [params?.id])

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/pdf`)
      if (!res.ok) return
      const html = await res.text()
      const w = window.open('', '_blank')
      if (!w) return
      w.document.open()
      w.document.write(html)
      w.document.close()
      // Give the new window a moment to render, then open print dialog
      w.onload = () => w.print()
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  const handleUpdateStatus = async () => {
    if (!invoice) return
    setMessage(null)
    if ((newStatus === 'PAID' || newStatus === 'PARTIAL') && paidAmount <= 0) {
      setMessage({ type: 'error', text: 'Jumlah dibayar harus diisi untuk status PAID atau PARTIAL.' })
      return
    }
    if (newStatus === 'PAID' && paidAmount < invoice.grandTotal) {
      setMessage({ type: 'error', text: 'Untuk status PAID, jumlah dibayar harus >= total invoice.' })
      return
    }
    if (newStatus === 'PARTIAL' && paidAmount >= invoice.grandTotal) {
      setMessage({ type: 'error', text: 'Untuk status PARTIAL, jumlah dibayar harus < total invoice.' })
      return
    }
    setUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paidAmount, notes })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: err.error || 'Gagal memperbarui status' })
        return
      }
      // refresh invoice data
      const updated = await res.json()
      setInvoice(prev => prev ? { ...prev, status: updated.status, paidAmount: updated.paidAmount } : prev)
      setMessage({ type: 'success', text: 'Status invoice berhasil diperbarui.' })
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">Loading...</div>
      </AdminLayout>
    )
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="p-6">Invoice tidak ditemukan.</div>
      </AdminLayout>
    )
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID')

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600"><ArrowLeft size={18} /></Button>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-blue-600" /> Invoice {invoice.invoiceNumber}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-gray-500">Tanggal</div>
              <div className="font-medium">{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Jatuh Tempo</div>
              <div className="font-medium">{formatDate(invoice.dueDate)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total</div>
              <div className="font-semibold text-blue-600">{formatCurrency(invoice.grandTotal)}</div>
            </div>
          </div>

          {/* Status badge + feedback */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status Saat Ini:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
              invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
              invoice.status === 'UNPAID' ? 'bg-yellow-100 text-yellow-800' :
              invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {invoice.status === 'PAID' && <CheckCircle size={14} />}
              {invoice.status === 'UNPAID' && <Clock size={14} />} 
              {invoice.status === 'OVERDUE' && <AlertTriangle size={14} />}
              {invoice.status === 'PARTIAL' && <DollarSign size={14} />}
              {invoice.status}
            </span>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubah Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL')} className="w-full px-3 py-2 border rounded">
                <option value="UNPAID">UNPAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="PARTIAL">PARTIAL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dibayar</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded"
                disabled={!(newStatus === 'PAID' || newStatus === 'PARTIAL')}
              />
              <div className="text-xs text-gray-500 mt-1">
                {newStatus === 'PAID' && 'Untuk PAID, jumlah dibayar harus >= total invoice.'}
                {newStatus === 'PARTIAL' && 'Untuk PARTIAL, jumlah dibayar harus < total invoice.'}
                {!(newStatus === 'PAID' || newStatus === 'PARTIAL') && 'Tidak perlu diisi untuk status ini.'}
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded" placeholder="Opsional" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button onClick={handleUpdateStatus} disabled={updating} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{updating ? 'Menyimpan...' : 'Simpan Status'}</button>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Klien</div>
            <div className="font-medium">{invoice.clientName}</div>
            {invoice.clientEmail && <div className="text-sm text-gray-600">{invoice.clientEmail}</div>}
            {invoice.clientPhone && <div className="text-sm text-gray-600">{invoice.clientPhone}</div>}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items?.map((it: InvoiceItem) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2">{it.description}</td>
                    <td className="px-4 py-2">{it.quantity}</td>
                    <td className="px-4 py-2">{formatCurrency(it.unitPrice)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => router.push(`/admin/invoices/${invoice.id}/edit`)} className="bg-yellow-600 hover:bg-yellow-700 text-white"><Edit size={16} className="mr-1"/> Edit</Button>
            <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white"><Download size={16} className="mr-1"/> Download</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


