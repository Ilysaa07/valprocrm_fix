'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';
import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session && session.user.role !== 'ADMIN') {
      router.push('/employee/chat');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <AdminLayout title="Chat Tim" description="Komunikasi real-time dengan tim">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Memuat...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout title="Chat Tim" description="Komunikasi real-time dengan tim">
      <div className="h-full">
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Memuat chat...</span>
          </div>
        }>
          <ChatLayout />
        </Suspense>
      </div>
    </AdminLayout>
  );
}

