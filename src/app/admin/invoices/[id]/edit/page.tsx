'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { InvoiceData, InvoiceItem } from '@/components/invoices/InvoicePreview';
import AppLayout from '@/components/layout/AppLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { showSuccess, showError } from '@/lib/swal';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<InvoiceData>>({
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
    notes: '',
    status: 'DRAFT'
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ]);

  const invoiceId = params.id as string;

  // Load invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      try {
        setInitialLoading(true);
        const response = await fetch(`/api/invoices/${invoiceId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Invoice tidak ditemukan');
            return;
          }
          throw new Error('Failed to fetch invoice');
        }

        const invoice = await response.json();
        
        // Populate form data
        setFormData({
          ...invoice,
          date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : formData.date,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : formData.dueDate,
        });

        // Populate items
        if (invoice.items && invoice.items.length > 0) {
          setItems(invoice.items.map((item: any, index: number) => ({
            id: item.id || (index + 1).toString(),
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || 0,
            subItems: item.subItems || []
          })));
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Gagal memuat data invoice');
      } finally {
        setInitialLoading(false);
      }
    };

    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/employee/invoices');
      return;
    }

    fetchInvoice();
  }, [session, status, router, invoiceId]);

  React.useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/employee/invoices');
      return;
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

  const calculateTotals = React.useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const discountType = formData.discountType || 'PERCENTAGE';
    const discountValue = Number(formData.discountValue || 0);
    const shippingAmount = Number(formData.shippingAmount || 0);

    const discountAmount = discountType === 'FIXED'
      ? Math.max(0, discountValue)
      : Math.max(0, Math.min(100, discountValue)) * subtotal / 100;

    const taxBase = Math.max(0, subtotal - discountAmount) + Math.max(0, shippingAmount);
    const taxRate = Number(formData.taxRate || 0);
    const taxAmount = Math.max(0, taxRate * taxBase / 100);
    const total = taxBase + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      items,
    }));
  }, [items, formData.discountType, formData.discountValue, formData.shippingAmount, formData.taxRate]);

  React.useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // clientEmail now optional
    if (!formData.invoiceNumber || !formData.clientName) {
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

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update invoice');
      }

      await showSuccess('Berhasil!', 'Invoice berhasil diperbarui');
      router.push(`/invoices/${invoiceId}`);
    } catch (err) {
      console.error('Error updating invoice:', err);
      await showError('Gagal!', err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AppLayout title="Edit Faktur" description="Edit faktur" role="ADMIN">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">{error}</div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Unified form: use shared InvoiceForm for edit mode
  return (
    <AppLayout title="Ubah Faktur" description="Perbarui data faktur" role="ADMIN">
      <div className="bg-white dark:bg-black/30 shadow-sm border border-black/10 dark:border-white/10 rounded-lg mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ubah Faktur</h1>
              <p className="text-gray-600 dark:text-gray-300">Perbarui data faktur</p>
            </div>
          </div>
        </div>
      </div>
      <InvoiceForm mode="edit" invoiceId={invoiceId} initialData={formData as any} initialItems={items as any} />
    </AppLayout>
  );

  return (
    <AppLayout title="Edit Faktur" description="Edit faktur" role="ADMIN">
      {/* Header */}
      <div className="bg-white shadow-sm border rounded-lg mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#042d63' }}>Edit Faktur</h1>
              <p className="text-gray-600">Edit faktur #{formData.invoiceNumber}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter invoice number or click Generate"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const timestamp = now.getTime().toString().slice(-6);
                      const generatedNumber = `INV-${year}${month}${day}-${timestamp}`;
                      setFormData(prev => ({ ...prev, invoiceNumber: generatedNumber }));
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Phone
                </label>
                <input
                  type="text"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Address
                </label>
                <textarea
                  value={formData.clientAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total
                    </label>
                    <input
                      type="text"
                      value={new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(item.total)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                {/* Sub Items (opsional) */}
                <div className="md:col-span-6">
                  <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sub Item (opsional)</span>
                      <button type="button" onClick={() => addSubItem(item.id)} className="text-sm px-2 py-1 rounded text-white" style={{ backgroundColor: '#042d63' }}>Tambah Sub Item</button>
                    </div>
                    {(item.subItems || []).length === 0 && (
                      <p className="text-xs text-gray-500">Belum ada sub item.</p>
                    )}
                    <div className="space-y-3">
                      {(item.subItems || []).map((si, siIndex) => (
                        <div key={siIndex} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Nama Sub Item</label>
                            <input type="text" value={si.name} onChange={(e) => updateSubItem(item.id, siIndex, 'name', e.target.value)} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Keterangan</label>
                            <input type="text" value={si.description || ''} onChange={(e) => updateSubItem(item.id, siIndex, 'description', e.target.value)} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Jumlah</label>
                            <input type="number" min="1" value={si.quantity} onChange={(e) => updateSubItem(item.id, siIndex, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Harga Satuan</label>
                            <input type="number" min="0" step="0.01" value={si.unitPrice} onChange={(e) => updateSubItem(item.id, siIndex, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="md:col-span-6 flex justify-between">
                            <span className="text-xs text-gray-600">Total Sub Item: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(si.total || 0)}</span>
                            <button type="button" onClick={() => removeSubItem(item.id, siIndex)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Hapus</button>
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

          {/* Discount, Shipping, Tax and Totals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount, Shipping & Tax</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'FIXED' | 'PERCENTAGE' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (Rp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shippingAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes or terms..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900 font-medium">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(formData.subtotal || 0)}
                  </span>
                </div>
                {formData.discountAmount !== undefined && formData.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-gray-900 font-medium">
                      - {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(formData.discountAmount || 0)}
                    </span>
                  </div>
                )}
                {formData.shippingAmount !== undefined && formData.shippingAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="text-gray-900 font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(formData.shippingAmount || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                  <span className="text-gray-900 font-medium">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(formData.taxAmount || 0)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(formData.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
