'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { InvoiceData } from '@/components/invoices/InvoicePreview';
import AppLayout from '@/components/layout/AppLayout';
import { showSuccess, showError, showConfirm } from '@/lib/swal';

export default function EmployeeInvoicesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user.role === 'ADMIN') {
      router.push('/admin/invoices');
      return;
    }

    fetchInvoices();
  }, [session, status, router]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices/my-invoices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      OVERDUE: 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PAID: 'Lunas',
      PARTIAL: 'Sebagian',
      OVERDUE: 'Terlambat'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {statusLabels[status as keyof typeof statusLabels] || status.toUpperCase()}
      </span>
    );
  };

  // currency formatting handled inline to keep alignment with Rp label

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    const result = await showConfirm(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus faktur #${invoiceNumber}? Tindakan ini tidak dapat dibatalkan.`,
      'Ya, Hapus',
      'Batal'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingInvoice(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invoice');
      }

      // Remove the deleted invoice from the list
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      
      // Show success message
      await showSuccess('Berhasil!', 'Faktur berhasil dihapus');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      await showError('Gagal!', err instanceof Error ? err.message : 'Gagal menghapus faktur');
    } finally {
      setDeletingInvoice(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Memuat faktur...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchInvoices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Faktur Saya" description="Lihat dan unduh faktur Anda" role="EMPLOYEE">
      {/* Header */}
      <div className="bg-card shadow-soft border border-border rounded-lg mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 sm:py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Faktur Saya</h1>
              <p className="text-text-secondary">Lihat dan unduh faktur Anda</p>
            </div>
            <Link
              href="/admin/invoices/create"
              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 bg-accent text-text-inverse hover:opacity-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Faktur
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-card rounded-lg shadow-soft border border-border p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Pencarian
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nomor faktur, klien, atau perusahaan..."
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="all">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Terkirim</option>
                <option value="PAID">Lunas</option>
                <option value="PARTIAL">Sebagian</option>
                <option value="OVERDUE">Terlambat</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="pb-8">
        <div className="bg-card rounded-lg shadow-soft border border-border overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <div className="text-text-tertiary text-5xl sm:text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Tidak ada faktur</h3>
              <p className="text-text-secondary mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Coba ubah kata kunci atau filter.'
                  : 'Anda belum memiliki faktur.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Link
                  href="/admin/invoices/create"
                  className="px-4 py-2 rounded-lg bg-accent text-text-inverse transition-opacity hover:opacity-90"
                >
                  Buat Faktur
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Card list */}
              <div className="md:hidden divide-y divide-border">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-text-primary">#{invoice.invoiceNumber}</div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="text-sm text-text-secondary">
                      <div className="text-text-primary">{invoice.clientName}</div>
                      <div className="truncate">{invoice.clientEmail}</div>
                    </div>
                    <div className="text-sm text-text-secondary">
                      <div className="text-text-primary">{new Date(invoice.date).toLocaleDateString('id-ID')}</div>
                      <div>Jatuh Tempo: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div className="text-right tabular-nums text-text-primary">
                      <span className="mr-1">Rp</span>
                      {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(invoice.total)}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link href={`/invoices/${invoice.id}`} className="px-3 py-1.5 rounded-md bg-accent text-text-inverse">Lihat</Link>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                        disabled={deletingInvoice === invoice.id}
                        className="px-3 py-1.5 rounded-md bg-red-500 text-white disabled:opacity-50"
                        title="Hapus faktur"
                      >
                        {deletingInvoice === invoice.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Faktur
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Klien
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-card-hover">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">
                          #{invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">{invoice.clientName}</div>
                        <div className="text-sm text-text-secondary">{invoice.clientEmail}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          {new Date(invoice.date).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-sm text-text-secondary">
                          Jatuh Tempo: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right tabular-nums">
                        <div className="inline-grid grid-cols-[24px_1fr] items-baseline justify-items-end">
                          <span className="text-sm font-medium text-text-primary">Rp</span>
                          <span className="text-sm font-medium text-text-primary text-right">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(invoice.total)}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-accent hover:opacity-90"
                          >
                            Lihat
                          </Link>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                            disabled={deletingInvoice === invoice.id}
                            className="text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus faktur"
                          >
                            {deletingInvoice === invoice.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
