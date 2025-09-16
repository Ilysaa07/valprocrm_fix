'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import InvoicePreview, { InvoiceData } from '@/components/invoices/InvoicePreview';
import { downloadPDF, printPDF, generateFilename } from '@/lib/pdf-utils';
import '@/styles/invoice-print.css';
import AppLayout from '@/components/layout/AppLayout';
import { showError } from '@/lib/swal';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const invoiceId = params.id as string;

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Invoice not found');
        } else if (response.status === 403) {
          setError('You do not have permission to view this invoice');
        } else {
          setError('Failed to load invoice');
        }
        return;
      }

      const data = await response.json();
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchInvoice();
  }, [session, status, invoiceId, router]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      await showError('Error!', 'PDF download is only available in the browser');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const filename = generateFilename(`invoice_${invoice.invoiceNumber}`);
      await downloadPDF('invoice-content', { filename });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      await showError('Gagal!', 'Failed to download PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!invoice) return;

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      await showError('Error!', 'Printing is only available in the browser');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      await printPDF('invoice-content');
    } catch (err) {
      console.error('Error printing:', err);
      await showError('Gagal!', 'Failed to print. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat faktur...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#042d63' }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Faktur Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-4">Faktur yang diminta tidak ditemukan.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#042d63' }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title={`Faktur #${invoice.invoiceNumber}`} description="Detail faktur" role={(session?.user?.role as 'ADMIN' | 'EMPLOYEE') || 'ADMIN'}>
          {/* Header */}
          <div className="bg-white shadow-sm border rounded-lg">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#042d63' }}>
                    Faktur #{invoice.invoiceNumber}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Dibuat pada {new Date(invoice.date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="flex gap-3">
                  {session?.user?.role === 'ADMIN' && (
                    <Link
                      href={`/admin/invoices/${invoice.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="px-0 sm:px-0 lg:px-0 py-6">
            <div className={`invoice-container ${isGeneratingPDF ? 'pdf-loading' : ''}`}>
              <InvoicePreview
                data={invoice}
                showActions={true}
                onDownload={handleDownloadPDF}
                onPrint={handlePrint}
              />
            </div>
          </div>

          {/* Floating Action Button for Mobile */}
          <div className="print-button print:hidden">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="text-white p-3 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Unduh PDF"
                style={{ backgroundColor: '#042d63' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={handlePrint}
                disabled={isGeneratingPDF}
                className="text-white p-3 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cetak"
                style={{ backgroundColor: '#042d63' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
    </AppLayout>
  );
}
