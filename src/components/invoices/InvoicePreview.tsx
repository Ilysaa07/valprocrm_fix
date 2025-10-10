'use client';

import React from 'react';
import Image from 'next/image';
import { Phone, Mail, Globe } from 'lucide-react';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  subItems?: { id?: string; name: string; description?: string; quantity: number; unitPrice: number; total: number }[];
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  invoiceTitle?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountValue?: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount?: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'PARTIAL';
}

interface InvoicePreviewProps {
  data: InvoiceData;
  showActions?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
}

export default function InvoicePreview({ 
  data, 
  showActions = true, 
  onDownload, 
  onPrint 
}: InvoicePreviewProps) {
  React.useEffect(() => {
    // Atur print settings untuk odd pages only
    const handleBeforePrint = () => {
      const printSettings = {
        shouldPrintPage: (pageNum: number) => pageNum % 2 === 1 // Only odd pages
      };
      // @ts-expect-error - Chrome WebView API
      if (window.chrome?.webview) {
        // @ts-expect-error - Chrome WebView API
        window.chrome.webview.postMessage({ printSettings });
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);

    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4;
        margin: 0;
        padding: 0;
      }
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @page :right {
          display: none;
        }
        html {
          background-color: white;
          margin: 0;
          padding: 0;
        }
        body {
          height: 260mm;
          width: 210mm;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        div {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        * {
          margin: 0 !important;
          padding: 0 !important;
        }
        #invoice-content {
          padding: 3mm !important;
          max-height: 260mm !important;
          height: 260mm !important;
          transform: scale(0.95) !important;
          transform-origin: top center !important;
          overflow: hidden !important;
          position: relative !important;
        }
        .section-wide {
          padding: 1.5mm !important;
        }
        table {
          font-size: 9px !important;
          margin-bottom: 2mm !important;
        }
        td, th {
          padding: 0.5mm 1mm !important;
          line-height: 1.1 !important;
        }
        h1 {
          font-size: 14px !important;
          line-height: 1.1 !important;
          margin-bottom: 1mm !important;
        }
        h3 {
          font-size: 11px !important;
          line-height: 1.1 !important;
          margin-bottom: 1mm !important;
        }
        p {
          font-size: 9px !important;
          line-height: 1.1 !important;
          margin: 0 !important;
        }
        .space-y-0\\.5 > * + * {
          margin-top: 0.5mm !important;
        }
        .space-y-2 > * + * {
          margin-top: 1mm !important;
        }
        .gap-4 {
          gap: 2mm !important;
        }
        .gap-6 {
          gap: 3mm !important;
        }
        .mb-3 {
          margin-bottom: 1mm !important;
        }
        .mb-2 {
          margin-bottom: 0.5mm !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());

  React.useEffect(() => {
    const intervalId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);
  const discountLabel = data.discountType
    ? (data.discountType === 'FIXED' ? ' (Rp)' : ` (${data.discountValue}%)`)
    : '';
  const translateStatus = (status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'PARTIAL') => {
    switch (status) {
      case 'PAID':
        return 'Lunas';
      case 'OVERDUE':
        return 'Terlambat';
      case 'SENT':
        return 'Terkirim';
      case 'DRAFT':
        return 'Draf';
      case 'PARTIAL':
        return 'Sebagian';
      default:
        return status;
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Tombol Aksi - Disembunyikan saat Cetak */}
      {showActions && (
        <div className="mb-6 print:hidden">
          <div className="flex gap-3">
            <button
              onClick={onDownload}
              className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: '#042d63' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Unduh PDF
            </button>
            <button
              onClick={() => {
                // Trigger print with custom settings
                window.dispatchEvent(new Event('beforeprint'));
                if (onPrint) onPrint();
              }}
              className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: '#042d63' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak
            </button>
          </div>
        </div>
      )}

      {/* Invoice Container - A4 Size */}
      <div 
        id="invoice-content"
        className="relative bg-white shadow-lg mx-auto print:shadow-none print:mx-0"
        style={{
          width: '210mm',
          height: '260mm',
          maxWidth: '100%',
          maxHeight: '260mm',
          overflow: 'hidden',
          background: '#ffffff',
          pageBreakAfter: 'avoid',
          pageBreakBefore: 'avoid',
          breakAfter: 'avoid',
          breakBefore: 'avoid',
          padding: '3mm',
          boxSizing: 'border-box',
          transform: 'scale(0.95)',
          transformOrigin: 'top center'
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden={true}
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center print:hidden invoice-watermark"
          style={{
            opacity: 0.05,
            zIndex: 0,
          }}
        >
          <Image
            src="/logo_invoice.png"
            alt="Watermark"
            width={200}
            height={100}
            style={{ width: '70%', maxWidth: '70%', height: 'auto' }}
          />
        </div>
        {/* Header */}
        <div className="relative p-4 print:p-2 border-b border-gray-200 invoice-header section-wide" style={{ zIndex: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-2 items-start">
            {/* Branding */}
            <div className="flex items-start gap-3">
              {/* <Image src="/logo_invoice.png" alt="Logo Perusahaan" width={120} height={40} className="h-10 w-auto print:h-8 block self-center" /> */}
              <div style={{ minWidth: '350px' }}>
                <h1 className="text-2xl font-bold mb-1 print:text-xl tracking-wide whitespace-nowrap" style={{ color: '#042d63' }}>{(data.companyName || '').replace('INTERTECH', 'INTER TECH')}</h1>
                <div className="text-xs text-gray-600 space-y-0.5 print:text-xs">
                  <p className="font-medium" style={{ color: '#042d63' }}>Business Entity Partner</p>
                  <p>{data.companyAddress}</p>
                </div>
              </div>
            </div>

            {/* Invoice meta */}
            <div className="md:justify-self-end w-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold print:text-lg tracking-wide text-right w-full" style={{ color: '#042d63' }}>{data.invoiceTitle || 'INVOICE'}</h2>
              </div>
              <div className="text-xs print:text-xs grid grid-cols-[100px_1fr] gap-y-1 gap-x-2">
                <span className="font-medium text-gray-700">No. Invoice:</span>
                <span className="text-right break-words">{data.invoiceNumber}</span>
                <span className="font-medium text-gray-700">Tanggal:</span>
                <span className="text-right">{formatDate(data.date)}</span>
                <span className="font-medium text-gray-700">Jatuh Tempo:</span>
                <span className="text-right">{formatDate(data.dueDate)}</span>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`text-right text-xs font-semibold ${
                  data.status === 'PAID' ? 'text-green-600' :
                  data.status === 'OVERDUE' ? 'text-red-600' :
                  data.status === 'SENT' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {translateStatus(data.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ditagihkan Kepada */}
        <div className="p-4 print:p-2 border-b border-gray-200 section-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base font-semibold mb-2 print:text-sm" style={{ color: '#042d63' }}>Ditagihkan Kepada:</h3>
              <div className="text-xs text-gray-600 space-y-0.5 print:text-xs">
                <p className="font-medium text-gray-900">{data.clientName}</p>
                {data.clientAddress && <p>{data.clientAddress}</p>}
                {data.clientPhone && <p>Telepon: {data.clientPhone}</p>}
                {data.clientEmail && <p>Email: {data.clientEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-4 py-4 print:px-0 print:py-2 section-wide">
          <div className="overflow-x-auto invoice-items-wrapper">
            <table className="w-full border-collapse table-fixed print:table-fixed mx-auto" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead className="print:table-header-group">
                <tr className="border-b print:!bg-[#042d63]" style={{ borderColor: '#042d63', backgroundColor: '#042d63' }}>
                  <th className="text-left py-1 px-1 font-semibold text-[10px] print:text-[9px] text-white">Deskripsi</th>
                  <th className="text-center py-1 px-1 font-semibold text-[10px] print:text-[9px] text-white">Jumlah</th>
                  <th className="text-center py-1 px-1 font-semibold text-[10px] print:text-[9px] text-white">Harga Satuan</th>
                  <th className="text-center py-1 px-1 font-semibold text-[10px] print:text-[9px] text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id} className={`border-b align-top ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} print:bg-white`} style={{ borderColor: '#e5e7eb' }}>
                    <td className="py-1 px-1 text-[11px] text-gray-900 align-top print:text-[10px]">
                      <div className="font-medium text-gray-900 leading-tight">{item.description}</div>
                      {item.subItems && item.subItems.length > 0 && (
                        <ul className="mt-0.5 text-gray-700 list-disc ml-3 space-y-0">
                          {item.subItems.map((si, idx) => (
                            <li key={idx} className="flex items-center gap-1 leading-tight">
                              <span>{si.name}</span>
                              <span className="text-[10px] text-gray-500">×{si.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-2 px-1 text-xs text-gray-900 text-center tabular-nums print:text-xs">{item.quantity}</td>
                    <td className="py-2 px-1 text-xs text-gray-900 tabular-nums print:text-xs">
                      <div className="grid grid-cols-[auto_1fr] gap-0.5 items-center">
                        <span className="text-left">Rp</span>
                        <span className="text-right">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.unitPrice)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-xs text-gray-900 font-medium tabular-nums print:text-xs">
                      <div className="grid grid-cols-[auto_1fr] gap-0.5 items-center">
                        <span className="text-left">Rp</span>
                        <span className="text-right">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.total)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="invoice-items-wrapper mt-4">
            <div className="w-full max-w-[450px] ml-auto">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-xs print:text-xs">
                    <span className="text-gray-700">Subtotal:</span>
                    <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                      <span className="w-6 text-left text-gray-900 font-medium">Rp</span>
                      <span className="flex-1 text-right text-gray-900 font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.subtotal)}</span>
                    </div>
                  </div>
                  
                  {(data.discountAmount !== undefined && data.discountAmount !== null && data.discountAmount > 0) && (
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-xs print:text-xs">
                      <span className="text-gray-700">Diskon{discountLabel}:</span>
                      <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                        <span className="w-6 text-left text-gray-900 font-medium">Rp</span>
                        <span className="flex-1 text-right text-gray-900 font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.discountAmount)}</span>
                      </div>
                    </div>
                  )}
                  
                  {(data.shippingAmount !== undefined && data.shippingAmount !== null && data.shippingAmount > 0) && (
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-xs print:text-xs">
                      <span className="text-gray-700">Biaya Pengiriman:</span>
                      <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                        <span className="w-6 text-left text-gray-900 font-medium">Rp</span>
                        <span className="flex-1 text-right text-gray-900 font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.shippingAmount)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-xs print:text-xs">
                    <span className="text-gray-700">Pajak ({data.taxRate}%):</span>
                    <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                      <span className="w-6 text-left text-gray-900 font-medium">Rp</span>
                      <span className="flex-1 text-right text-gray-900 font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.taxAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-sm font-bold print:text-sm" style={{ color: '#042d63' }}>
                      <span>Total:</span>
                      <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                        <span className="w-6 text-left">Rp</span>
                        <span className="flex-1 text-right">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.total)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {(data.amountPaid !== undefined && data.amountPaid !== null && data.amountPaid > 0) && (
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-xs print:text-xs">
                      <span className="text-gray-700">Dibayar:</span>
                      <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                        <span className="w-6 text-left text-gray-900 font-medium">Rp</span>
                        <span className="flex-1 text-right text-gray-900 font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.amountPaid)}</span>
                      </div>
                    </div>
                  )}
                  
                  {(data.status !== 'PAID' && data.balanceDue !== undefined && data.balanceDue !== null && data.balanceDue > 0) && (
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center text-xs print:text-xs">
                      <span className="text-gray-700">Sisa/Balance Due:</span>
                      <div className="flex items-baseline gap-0.5 tabular-nums min-w-[120px]">
                        <span className="w-6 text-left text-gray-900 font-medium">Rp</span>
                        <span className="flex-1 text-right text-gray-900 font-medium">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.balanceDue || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="p-4 print:p-2 border-t border-gray-200 section-wide">
            <h3 className="text-sm font-semibold mb-1 print:text-xs" style={{ color: '#042d63' }}>Catatan:</h3>
            <p className="text-xs text-gray-700 whitespace-pre-wrap print:text-xs">{data.notes}</p>
          </div>
        )}

        {/* Footer: Payment details (left) and contact (right) - refined */}
        <div className="p-4 pt-2 print:p-2 border-t border-gray-200 section-wide" style={{ zIndex: 1, position: 'relative' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Payment details */}
            <div className="bg-white rounded-md border border-gray-200 p-1.5 print:text-[9px] flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <span className="inline-block w-0.5 h-3 rounded-sm" style={{ backgroundColor: '#042d63' }}></span>
                <h3 className="text-[11px] font-semibold print:text-[9px] tracking-wide" style={{ color: '#042d63' }}>Detail Pembayaran</h3>
              </div>
              <div className="text-[10px] text-gray-800 space-y-1 print:text-[9px]">
                <div className="grid grid-cols-[20px_1fr] items-center gap-1">
                  <Image src="/BRI.png" alt="BRI" width={20} height={20} className="w-5 h-auto print:w-4 object-contain block" />
                  <div className="flex items-baseline gap-1">
                    <span className="font-medium">BRI</span>
                    <span className="font-medium tabular-nums">2105 0100 0365 563</span>
                  </div>
                </div>
                <div className="grid grid-cols-[28px_1fr] items-center gap-2">
                  <Image src="/BCA.png" alt="BCA" width={28} height={28} className="w-7 h-auto print:w-6 object-contain block" />
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">BCA</span>
                    <span className="font-medium tabular-nums">4373249575</span>
                  </div>
                </div>
                <div className="pt-1 text-gray-900">
                  <span className="font-medium">a.n</span> {data.accountHolder || 'PT Valpro Inter Tech'}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-md border border-gray-200 p-1.5 print:text-[9px] md:justify-self-end w-full flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <span className="inline-block w-0.5 h-3 rounded-sm" style={{ backgroundColor: '#042d63' }}></span>
                <h3 className="text-[11px] font-semibold print:text-[9px] tracking-wide" style={{ color: '#042d63' }}>Kontak</h3>
              </div>
              <div className="text-[10px] text-gray-800 space-y-1 print:text-[9px]">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-gray-700 shrink-0 min-w-[12px]" />
                  <span className="tracking-wide break-words leading-tight">{data.companyPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-gray-700 shrink-0 min-w-[12px]" />
                  <span className="tracking-wide break-words leading-tight">{data.companyEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-gray-700 shrink-0 min-w-[12px]" />
                  <span className="tracking-wide break-words leading-tight">www.valprointertech.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime timestamp footer */}
        <div className="px-4 pb-4 pt-1 print:px-2 print:pt-1 print:pb-2 section-wide">
          <div className="text-[10px] text-gray-500 text-center border-t border-gray-200 pt-1">
            <span>
              Waktu cetak: {currentTime.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </span>
            <span className="mx-2">•</span>
            <span>
              Invoice ini dibuat secara otomatis oleh website Valpro EMS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}