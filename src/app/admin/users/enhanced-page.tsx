'use client'

import { Suspense } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import EnhancedUserManagement from '@/components/user-management/EnhancedUserManagement'

function UsersPageInner() {
  return (
    <AdminLayout>
      <EnhancedUserManagement />
    </AdminLayout>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <UsersPageInner />
    </Suspense>
  )
}
