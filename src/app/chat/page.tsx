import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';
import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
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
