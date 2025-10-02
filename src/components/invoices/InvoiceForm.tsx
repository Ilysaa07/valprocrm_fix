'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { showError, showSuccess } from '@/lib/swal';
import { InvoiceData, InvoiceItem } from './InvoicePreview';
type SubItem = { id?: string; name: string; description?: string; quantity: number; unitPrice: number; total: number };

type Mode = 'create' | 'edit';

interface InvoiceFormProps {
  mode: Mode;
  initialData?: Partial<InvoiceData>;
  initialItems?: InvoiceItem[];
  invoiceId?: string;
}

export default function InvoiceForm({ mode, initialData, initialItems, invoiceId }: InvoiceFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<Partial<InvoiceData>>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    companyName: 'PT. VALPRO INTERTECH',
    companyAddress: 'JL. Raya Gading Tutuka No.175B, Soreang Kab.Bandung Jawa Barat Indonesia',
    companyPhone: '081399710085',
    companyEmail: 'mail@valprointertech.com',
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientEmail: '',
    items: [],
    subtotal: 0,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 11,
    taxAmount: 0,
    shippingAmount: 0,
    total: 0,
    amountPaid: 0,
    balanceDue: 0,
    notes: '',
    status: 'DRAFT',
    ...(initialData || {})
  });

  const [items, setItems] = React.useState<InvoiceItem[]>(() => initialItems && initialItems.length > 0 ? initialItems : [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  const generateInvoiceNumber = async () => {
    try {
      // Call API to get next sequential invoice number
      const response = await fetch('/api/invoices/next-number');
      if (response.ok) {
        const { invoiceNumber } = await response.json();
        setFormData(prev => ({ ...prev, invoiceNumber }));
      } else {
        // Fallback to client-side generation if API fails
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const invoiceNumber = `INV-${year}${month}${day}-0001`;
        setFormData(prev => ({ ...prev, invoiceNumber }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to client-side generation
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const invoiceNumber = `INV-${year}${month}${day}-0001`;
      setFormData(prev => ({ ...prev, invoiceNumber }));
    }
  };

  const normalizeLeadingZeros = (raw: string): string => {
    if (raw === '') return '';
    return raw.replace(/^(-?)0+(?=\d)/, '$1');
  };

  const addItem = () => {
    const newItem: InvoiceItem = { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0, subItems: [] };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value } as InvoiceItem;
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const addSubItem = (itemId: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const sub = { name: '', description: '', quantity: 1, unitPrice: 0, total: 0 } as SubItem;
      const subItems = (Array.isArray(it.subItems) ? [...it.subItems] : []) as SubItem[];
      subItems.push(sub);
      return { ...it, subItems } as InvoiceItem;
    }));
  };

  const updateSubItem = (itemId: string, index: number, field: 'name'|'description'|'quantity'|'unitPrice', value: string | number) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const subItems = ((it.subItems || []) as SubItem[]).map((si: SubItem, idx: number) => {
        if (idx !== index) return si;
        const next: SubItem = { ...si, [field]: value } as SubItem;
        if (field === 'quantity' || field === 'unitPrice') {
          next.total = Number(next.quantity) * Number(next.unitPrice);
        }
        return next;
      });
      return { ...it, subItems } as InvoiceItem;
    }));
  };

  const removeSubItem = (itemId: string, index: number) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const subItems = (it.subItems || []).filter((_, idx) => idx !== index);
      return { ...it, subItems } as InvoiceItem;
    }));
  };

  const calculateTotals = React.useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const discountType = formData.discountType || 'PERCENTAGE';
    const discountValue = Number(formData.discountValue || 0);
    const shippingAmount = Number(formData.shippingAmount || 0);
    const amountPaid = Number(formData.amountPaid || 0);

    const discountAmount = discountType === 'FIXED'
      ? Math.max(0, discountValue)
      : Math.max(0, Math.min(100, discountValue)) * subtotal / 100;

    const taxBase = Math.max(0, subtotal - discountAmount) + Math.max(0, shippingAmount);
    const taxRate = Number(formData.taxRate || 0);
    const taxAmount = Math.max(0, taxRate * taxBase / 100);
    const total = taxBase + taxAmount;
    const balanceDue = total - amountPaid;

    let statusFinal = 'DRAFT' as InvoiceData['status'];
    if (amountPaid >= total && total > 0) statusFinal = 'PAID';
    else if (amountPaid > 0 && amountPaid < total) statusFinal = 'PARTIAL';

    setFormData(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      amountPaid,
      balanceDue,
      status: statusFinal,
      items,
    }));
  }, [items, formData.discountType, formData.discountValue, formData.shippingAmount, formData.taxRate, formData.amountPaid]);

  React.useEffect(() => { calculateTotals(); }, [calculateTotals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.clientName) {
      setError('Mohon lengkapi nomor faktur dan nama klien');
      return;
    }
    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Mohon lengkapi detail item dengan benar');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const endpoint = mode === 'create' ? '/api/invoices' : `/api/invoices/${invoiceId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            subItems: (item.subItems || []).map(si => ({
              name: si.name,
              description: si.description,
              quantity: si.quantity,
              unitPrice: si.unitPrice,
              total: si.total,
            }))
          }))
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(errorData.error || `Gagal ${mode === 'create' ? 'membuat' : 'memperbarui'} faktur`);
      }
      await showSuccess('Berhasil!', `Faktur berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}`);
      router.push('/admin/invoices');
    } catch (err) {
      console.error('Error submit invoice:', err);
      await showError('Gagal!', err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3 text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-soft border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Detail Faktur</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nomor Faktur *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="flex-1 input-default px-3 py-2 rounded-lg"
                placeholder="INV-20240115-0001"
                required
              />
              {mode === 'create' && (
                <button type="button" onClick={generateInvoiceNumber} className="px-4 py-2 rounded-lg btn-primary">Generate</button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tanggal Faktur *</label>
            <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full input-default px-3 py-2 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Jatuh Tempo *</label>
            <input type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full input-default px-3 py-2 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
            <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InvoiceData['status'] }))} className="w-full input-default px-3 py-2 rounded-lg">
              <option value="DRAFT">Draft</option>
              <option value="SENT">Terkirim</option>
              <option value="PAID">Lunas</option>
              <option value="PARTIAL">Sebagian</option>
              <option value="OVERDUE">Terlambat</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-soft border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Detail Klien</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nama Klien *</label>
            <input type="text" value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="Masukkan nama klien" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email Klien (Opsional)</label>
            <input type="email" value={formData.clientEmail || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="klien@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Telepon Klien</label>
            <input type="text" value={formData.clientPhone || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="08123456789" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Alamat Klien</label>
            <textarea value={formData.clientAddress || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))} rows={3} className="w-full input-default px-3 py-2 rounded-lg" placeholder="Masukkan alamat lengkap klien" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-soft border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Item Barang/Jasa</h2>
          <button type="button" onClick={addItem} className="px-4 py-2 rounded-lg btn-primary w-full sm:w-auto">Tambah Item</button>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">Deskripsi Barang/Jasa</label>
                <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full input-default px-3 py-2 rounded-lg" placeholder="Masukkan deskripsi barang/jasa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Jumlah</label>
                <input type="number" min="1" value={item.quantity === 0 ? '' : item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(normalizeLeadingZeros(e.target.value)) || 0)} className="w-full input-default px-3 py-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Harga Satuan</label>
                <input type="number" min="0" step="0.01" value={item.unitPrice === 0 ? '' : item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(normalizeLeadingZeros(e.target.value)) || 0)} className="w-full input-default px-3 py-2 rounded-lg" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Total</label>
                <div className="w-full px-3 py-2 border border-border rounded-lg bg-elevated text-gray-900 dark:text-gray-200 flex justify-between items-center">
                  <span>Rp</span>
                  <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(item.total)}</span>
                </div>
              </div>
              <div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(item.id)} className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Hapus</button>
                )}
              </div>
              <div className="md:col-span-6">
                <div className="mt-3 p-3 border border-border rounded-lg bg-elevated">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">Sub Item (opsional)</span>
                    <button type="button" onClick={() => addSubItem(item.id)} className="text-sm px-3 py-1 rounded btn-primary">Tambah Sub Item</button>
                  </div>
                  {(item.subItems || []).length === 0 && (
                    <p className="text-xs text-text-tertiary">Belum ada sub item.</p>
                  )}
                  <div className="space-y-3">
                    {(item.subItems || []).map((si, siIndex) => (
                      <div key={siIndex} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-text-secondary mb-1">Nama Sub Item</label>
                          <input type="text" value={si.name} onChange={(e) => updateSubItem(item.id, siIndex, 'name', e.target.value)} className="w-full input-default px-3 py-2 rounded" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-text-secondary mb-1">Keterangan</label>
                          <input type="text" value={si.description || ''} onChange={(e) => updateSubItem(item.id, siIndex, 'description', e.target.value)} className="w-full input-default px-3 py-2 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Jumlah</label>
                          <input type="number" min="1" value={(si.quantity || 0) === 0 ? '' : si.quantity} onChange={(e) => updateSubItem(item.id, siIndex, 'quantity', parseInt(normalizeLeadingZeros(e.target.value)) || 0)} className="w-full input-default px-3 py-2 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Harga Satuan</label>
                          <input type="number" min="0" step="0.01" value={(si.unitPrice || 0) === 0 ? '' : si.unitPrice} onChange={(e) => updateSubItem(item.id, siIndex, 'unitPrice', parseFloat(normalizeLeadingZeros(e.target.value)) || 0)} className="w-full input-default px-3 py-2 rounded" />
                        </div>
                        <div className="md:col-span-6 flex justify-between items-center">
                          <div className="text-xs text-text-secondary">Total Sub Item: Rp {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(si.total || 0)}</div>
                          <button type="button" onClick={() => removeSubItem(item.id, siIndex)} className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-soft border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Diskon, Biaya Pengiriman, Pajak & Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tipe Diskon (Opsional)</label>
            <select value={formData.discountType} onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'FIXED' | 'PERCENTAGE' }))} className="w-full input-default px-3 py-2 rounded-lg">
              <option value="PERCENTAGE">Persentase (%)</option>
              <option value="FIXED">Tetap (Rp)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nilai Diskon (Opsional)</label>
            <input type="number" min="0" step="0.01" value={(formData.discountValue || 0) === 0 ? '' : formData.discountValue} onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(normalizeLeadingZeros(e.target.value)) || 0 }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Biaya Pengiriman (Opsional)</label>
            <input type="number" min="0" step="0.01" value={(formData.shippingAmount || 0) === 0 ? '' : formData.shippingAmount} onChange={(e) => setFormData(prev => ({ ...prev, shippingAmount: parseFloat(normalizeLeadingZeros(e.target.value)) || 0 }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Dibayar</label>
            <input type="number" min="0" step="0.01" value={(formData.amountPaid || 0) === 0 ? '' : formData.amountPaid} onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: parseFloat(normalizeLeadingZeros(e.target.value)) || 0 }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Pajak (%) - Opsional</label>
            <input type="number" min="0" max="100" step="0.01" value={(formData.taxRate || 0) === 0 ? '' : formData.taxRate} onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(normalizeLeadingZeros(e.target.value)) || 0 }))} className="w-full input-default px-3 py-2 rounded-lg" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Catatan</label>
            <textarea value={formData.notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full input-default px-3 py-2 rounded-lg" placeholder="Catatan tambahan atau syarat..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal:</span>
              <div className="flex justify-between items-center w-24">
                <span className="text-text-primary font-medium">Rp</span>
                <span className="text-text-primary font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.subtotal || 0)}</span>
              </div>
            </div>
            {(formData.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Diskon:</span>
                <div className="flex justify-between items-center w-24">
                  <span className="text-text-primary font-medium">Rp</span>
                  <span className="text-text-primary font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.discountAmount || 0)}</span>
                </div>
              </div>
            )}
            {(formData.shippingAmount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Biaya Pengiriman:</span>
                <div className="flex justify-between items-center w-24">
                  <span className="text-text-primary font-medium">Rp</span>
                  <span className="text-text-primary font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.shippingAmount || 0)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Pajak ({formData.taxRate}%):</span>
              <div className="flex justify-between items-center w-24">
                <span className="text-text-primary font-medium">Rp</span>
                <span className="text-text-primary font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.taxAmount || 0)}</span>
              </div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-text-primary">Total:</span>
                <div className="flex justify-between items-center w-24">
                  <span className="text-text-primary">Rp</span>
                  <span className="text-text-primary">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.total || 0)}</span>
                </div>
              </div>
            </div>
            {(formData.amountPaid || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Dibayar:</span>
                <div className="flex justify-between items-center w-24">
                  <span className="text-text-primary font-medium">Rp</span>
                  <span className="text-text-primary font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.amountPaid || 0)}</span>
                </div>
              </div>
            )}
            {(formData.status !== 'PAID' && (formData.balanceDue || 0) > 0) && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-text-primary">Sisa/Balance Due:</span>
                <div className="flex justify-between items-center w-24">
                  <span className="text-text-primary">Rp</span>
                  <span className="text-text-primary">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(formData.balanceDue || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop action buttons */}
      <div className="hidden md:flex justify-end space-x-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{loading ? (mode === 'create' ? 'Membuat...' : 'Menyimpan...') : (mode === 'create' ? 'Buat Faktur' : 'Simpan Perubahan')}</button>
      </div>

      {/* Sticky mobile action bar */}
      <div className="md:hidden h-16" />
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex gap-3 items-center z-40" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-3 rounded-lg btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </form>
  );
}


