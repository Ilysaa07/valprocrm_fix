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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#042d63] to-[#1e40af] text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/20">
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <FileText className="text-[#042d63]" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
                  <p className="text-white/80">Detail dan kelola invoice</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Invoice Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-[#042d63] to-[#1e40af] text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">PT.VALPRO INTER TECH</h2>
                  <p className="text-white/90 mb-4">Business Entity Partner</p>
                  <div className="text-sm text-white/80">
                    <p>JL. Raya Gading Tutuka No.1758</p>
                    <p>Soreang Kab.Bandung Jawa Barat Indonesia</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold mb-2">INVOICE</div>
                  <div className="text-lg font-semibold">PT.VALPRO INTER TECH</div>
                  <div className="text-sm text-white/90">Business Entity Partner</div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Client Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice untuk :</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xl font-bold text-gray-900 mb-2">{invoice.clientName}</div>
                    {invoice.clientEmail && <div className="text-gray-600 mb-1">Email: {invoice.clientEmail}</div>}
                    {invoice.clientPhone && <div className="text-gray-600">Telp: {invoice.clientPhone}</div>}
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="text-right">
                  <div className="bg-[#042d63] text-white p-4 rounded-lg">
                    <div className="text-lg font-bold mb-2">Invoice No | {invoice.invoiceNumber}</div>
                    <div className="text-base font-semibold">Tanggal Invoice | {formatDate(invoice.issueDate)}</div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Status Invoice</h3>
                  <span className={`px-4 py-2 text-sm font-medium rounded-full inline-flex items-center gap-2 ${
                    invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'UNPAID' ? 'bg-yellow-100 text-yellow-800' :
                    invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {invoice.status === 'PAID' && <CheckCircle size={16} />}
                    {invoice.status === 'UNPAID' && <Clock size={16} />} 
                    {invoice.status === 'OVERDUE' && <AlertTriangle size={16} />}
                    {invoice.status === 'PARTIAL' && <DollarSign size={16} />}
                    {invoice.status}
                  </span>
                </div>

                {message && (
                  <div className={`p-4 rounded-lg text-sm mb-4 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Status Update Form */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Update Status Invoice</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ubah Status</label>
                      <select 
                        value={newStatus} 
                        onChange={e => setNewStatus(e.target.value as 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL')} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#042d63] focus:border-transparent"
                      >
                        <option value="UNPAID">UNPAID</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                        <option value="PARTIAL">PARTIAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Dibayar</label>
                      <input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#042d63] focus:border-transparent"
                        disabled={!(newStatus === 'PAID' || newStatus === 'PARTIAL')}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {newStatus === 'PAID' && 'Untuk PAID, jumlah dibayar harus >= total invoice.'}
                        {newStatus === 'PARTIAL' && 'Untuk PARTIAL, jumlah dibayar harus < total invoice.'}
                        {!(newStatus === 'PAID' || newStatus === 'PARTIAL') && 'Tidak perlu diisi untuk status ini.'}
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                      <textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                        rows={2} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#042d63] focus:border-transparent" 
                        placeholder="Opsional" 
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button 
                        onClick={handleUpdateStatus} 
                        disabled={updating} 
                        className="px-6 py-2 rounded-lg bg-[#042d63] text-white font-medium hover:bg-[#1e40af] disabled:opacity-50 transition-colors"
                      >
                        {updating ? 'Menyimpan...' : 'Simpan Status'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Item</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#042d63] text-white">
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Item</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Jumlah</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Harga</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoice.items?.map((it: InvoiceItem) => (
                        <tr key={it.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{it.description}</div>
                            {it.description.includes('Paket') && (
                              <div className="text-sm text-gray-600 mt-2">
                                <ul className="list-disc list-inside space-y-1">
                                  <li>5 Subklas SBU Gedung ,termasuk Sewa</li>
                                  <li>tenaga Ahli untuk SKK</li>
                                  <li>SBU BG 001, 002 ,005 ,006 ,009</li>
                                  <li>SKK PJTBU Jenjang 6</li>
                                  <li>SKK PJSKBU Jenjang 4</li>
                                </ul>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-900">{it.quantity}</td>
                          <td className="px-6 py-4 text-gray-900">{formatCurrency(it.unitPrice)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(invoice.grandTotal)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between text-lg font-bold text-[#042d63]">
                          <span>Total</span>
                          <span>{formatCurrency(invoice.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#042d63] rounded text-white flex items-center justify-center text-xs font-bold">BRI</div>
                      <div>
                        <div className="font-semibold">2105 0100 0365 563</div>
                        <div className="text-sm text-gray-600">a.n PT Valpro Inter Tech</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#042d63] rounded text-white flex items-center justify-center text-xs font-bold">BCA</div>
                      <div>
                        <div className="font-semibold">4373249575</div>
                        <div className="text-sm text-gray-600">a.n PT Valpro Inter Tech</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button 
                  onClick={() => router.push(`/admin/invoices/${invoice.id}/edit`)} 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <Edit size={16} className="mr-2"/> Edit
                </Button>
                <Button 
                  onClick={handleDownload} 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download size={16} className="mr-2"/> Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


