'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';
import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">Memuat...</span>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = session.user.role;

  if (role === 'ADMIN') {
    return (
      <AdminLayout>
        <div className="h-full">
          <Suspense fallback={<div className="p-6">Memuat chat...</div>}>
            <ChatLayout />
          </Suspense>
        </div>
      </AdminLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="h-full">
        <Suspense fallback={<div className="p-6">Memuat chat...</div>}>
          <ChatLayout />
        </Suspense>
      </div>
    </EmployeeLayout>
  );
}
