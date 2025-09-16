'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { InvoiceData, InvoiceItem } from '@/components/invoices/InvoicePreview';
import AppLayout from '@/components/layout/AppLayout';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<InvoiceData>>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
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
    taxRate: 11, // Default 11% PPN
    taxAmount: 0,
    shippingAmount: 0,
    total: 0,
    amountPaid: 0,
    balanceDue: 0,
    notes: '',
    status: 'DRAFT'
  });

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${year}${month}${day}-${random}`;
    setFormData(prev => ({ ...prev, invoiceNumber }));
  };

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ]);

  React.useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      // Allow employees to create their own invoices per new rules
      // router.push('/employee/invoices');
    }
  }, [session, status, router]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      subItems: []
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as InvoiceItem;
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const addSubItem = (itemId: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const sub = { name: '', description: '', quantity: 1, unitPrice: 0, total: 0 };
      const subItems = Array.isArray(it.subItems) ? [...it.subItems, sub] : [sub];
      return { ...it, subItems } as InvoiceItem;
    }));
  };

  const updateSubItem = (itemId: string, index: number, field: 'name'|'description'|'quantity'|'unitPrice', value: string | number) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const subItems = (it.subItems || []).map((si, idx) => {
        if (idx !== index) return si;
        const next = { ...si, [field]: value };
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

  const calculateTotals = useCallback(() => {
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

    // Calculate status automatically
    let status = 'DRAFT';
    if (amountPaid >= total && total > 0) {
      status = 'PAID';
    } else if (amountPaid === 0) {
      status = 'DRAFT';
    } else if (amountPaid > 0 && amountPaid < total) {
      status = 'PARTIAL';
    }

    setFormData(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      amountPaid,
      balanceDue,
      status: status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'PARTIAL',
      items,
    }));
  }, [items, formData.discountType, formData.discountValue, formData.shippingAmount, formData.taxRate, formData.amountPaid]);

  React.useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoiceNumber || !formData.clientName || !formData.clientEmail) {
      setError('Please fill in all required fields');
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please fill in all item details correctly');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const createdInvoice = await response.json();
      router.push(`/invoices/${createdInvoice.id}`);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Buat Faktur" description="Buat faktur baru untuk klien" role="ADMIN">
      {/* Header */}
      <div className="bg-white dark:bg-black/30 shadow-sm border border-black/10 dark:border-white/10 rounded-lg mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Buat Faktur</h1>
              <p className="text-gray-600 dark:text-gray-300">Buat faktur baru untuk klien</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Terjadi Kesalahan</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Detail Faktur */}
          <div className="bg-white dark:bg-black/30 rounded-lg shadow border border-black/10 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detail Faktur</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomor Faktur *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                    placeholder="INV-20240115-0001"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateInvoiceNumber}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Faktur *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jatuh Tempo *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'PARTIAL' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Terkirim</option>
                  <option value="PAID">Lunas</option>
                  <option value="PARTIAL">Sebagian</option>
                  <option value="OVERDUE">Terlambat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detail Klien */}
          <div className="bg-white dark:bg-black/30 rounded-lg shadow border border-black/10 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detail Klien</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Klien *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                  placeholder="Masukkan nama klien"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Klien *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                  placeholder="klien@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telepon Klien
                </label>
                <input
                  type="text"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alamat Klien
                </label>
                <textarea
                  value={formData.clientAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                  placeholder="Masukkan alamat lengkap klien"
                />
              </div>
            </div>
          </div>

          {/* Item Barang/Jasa */}
          <div className="bg-white dark:bg-black/30 rounded-lg shadow border border-black/10 dark:border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Item Barang/Jasa</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Item
              </button>
            </div>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Deskripsi Barang/Jasa
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                      placeholder="Masukkan deskripsi barang/jasa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Harga Satuan
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-gray-200 flex justify-between items-center">
                      <span>Rp</span>
                      <span>{new Intl.NumberFormat('id-ID', {
                        minimumFractionDigits: 0,
                      }).format(item.total)}</span>
                    </div>
                  </div>
                  <div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    )}
                  </div>
                {/* Sub Items (opsional) */}
                <div className="md:col-span-6">
                  <div className="mt-3 p-3 border border-gray-300 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sub Item (opsional)</span>
                      <button 
                        type="button" 
                        onClick={() => addSubItem(item.id)} 
                        className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Sub Item
                      </button>
                    </div>
                    {(item.subItems || []).length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada sub item.</p>
                    )}
                    <div className="space-y-3">
                      {(item.subItems || []).map((si, siIndex) => (
                        <div key={siIndex} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nama Sub Item</label>
                            <input 
                              type="text" 
                              value={si.name} 
                              onChange={(e) => updateSubItem(item.id, siIndex, 'name', e.target.value)} 
                              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200" 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Keterangan</label>
                            <input 
                              type="text" 
                              value={si.description || ''} 
                              onChange={(e) => updateSubItem(item.id, siIndex, 'description', e.target.value)} 
                              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Jumlah</label>
                            <input 
                              type="number" 
                              min="1" 
                              value={si.quantity} 
                              onChange={(e) => updateSubItem(item.id, siIndex, 'quantity', parseInt(e.target.value) || 0)} 
                              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Harga Satuan</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={si.unitPrice} 
                              onChange={(e) => updateSubItem(item.id, siIndex, 'unitPrice', parseFloat(e.target.value) || 0)} 
                              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded bg-white dark:bg-black/20 text-gray-900 dark:text-gray-200" 
                            />
                          </div>
                          <div className="md:col-span-6 flex justify-between items-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
                              <span>Total Sub Item: Rp</span>
                              <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(si.total || 0)}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeSubItem(item.id, siIndex)} 
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Hapus
                            </button>
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

          {/* Discount, Shipping, Tax and Payment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount, Biaya Pengiriman, Pajak & Pembayaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Diskon (Opsional)</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'FIXED' | 'PERCENTAGE' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Tetap (Rp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Diskon (Opsional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Biaya Pengiriman (Opsional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shippingAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dibayar</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pajak (%) - Opsional
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Catatan tambahan atau syarat..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <div className="flex justify-between items-center w-24">
                    <span className="text-gray-900 font-medium">Rp</span>
                    <span className="text-gray-900 font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        minimumFractionDigits: 0,
                      }).format(formData.subtotal || 0)}
                    </span>
                  </div>
                </div>
                {(formData.discountAmount !== undefined && formData.discountAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon:</span>
                    <div className="flex justify-between items-center w-24">
                      <span className="text-gray-900 font-medium">Rp</span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat('id-ID', {
                          minimumFractionDigits: 0,
                        }).format(formData.discountAmount || 0)}
                      </span>
                    </div>
                  </div>
                )}
                {(formData.shippingAmount !== undefined && formData.shippingAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya Pengiriman:</span>
                    <div className="flex justify-between items-center w-24">
                      <span className="text-gray-900 font-medium">Rp</span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat('id-ID', {
                          minimumFractionDigits: 0,
                        }).format(formData.shippingAmount || 0)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak ({formData.taxRate}%):</span>
                  <div className="flex justify-between items-center w-24">
                    <span className="text-gray-900 font-medium">Rp</span>
                    <span className="text-gray-900 font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        minimumFractionDigits: 0,
                      }).format(formData.taxAmount || 0)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <div className="flex justify-between items-center w-24">
                      <span className="text-gray-900">Rp</span>
                      <span className="text-gray-900">
                        {new Intl.NumberFormat('id-ID', {
                          minimumFractionDigits: 0,
                        }).format(formData.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                {(formData.amountPaid !== undefined && formData.amountPaid > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dibayar:</span>
                    <div className="flex justify-between items-center w-24">
                      <span className="text-gray-900 font-medium">Rp</span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat('id-ID', {
                          minimumFractionDigits: 0,
                        }).format(formData.amountPaid || 0)}
                      </span>
                    </div>
                  </div>
                )}
                {(formData.status !== 'PAID' && formData.balanceDue !== undefined && formData.balanceDue !== null && (formData.balanceDue || 0) > 0) && (
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Sisa/Balance Due:</span>
                    <div className="flex justify-between items-center w-24">
                      <span className="text-gray-900">Rp</span>
                      <span className="text-gray-900">
                        {new Intl.NumberFormat('id-ID', {
                          minimumFractionDigits: 0,
                        }).format(formData.balanceDue || 0)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    formData.status === 'PAID' ? 'text-green-600' :
                    formData.status === 'PARTIAL' ? 'text-yellow-600' :
                    formData.status === 'OVERDUE' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {formData.status === 'PAID' ? 'Lunas' :
                     formData.status === 'PARTIAL' ? 'Sebagian' :
                     formData.status === 'OVERDUE' ? 'Terlambat' :
                     'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Membuat...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Buat Faktur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
