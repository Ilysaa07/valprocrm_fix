'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/layout/AppLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Buat Faktur" description="Buat faktur baru untuk klien" role="ADMIN">
      {/* Header */}
      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#042d63' }}>
                Buat Faktur Baru
              </h1>
              <p className="text-sm text-gray-600">
                Buat faktur baru untuk klien Anda
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <InvoiceForm mode="create" />
    </AppLayout>
  );
}
