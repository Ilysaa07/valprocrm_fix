import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';
import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';

export default async function AdminChatPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Ensure only admin can access this page
  if (session.user.role !== 'ADMIN') {
    redirect('/employee/chat');
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

