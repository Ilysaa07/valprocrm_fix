"use client"

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Link from 'next/link'

interface PendingUser {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/users?status=PENDING')
        const data = await res.json()
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data?.data) ? data.data : []
        setUsers(list)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Registrasi Pending</h1>
          <Link href="/admin/users" className="text-blue-600 hover:underline">Kembali ke Kelola Karyawan</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg shadow p-6 text-center border border-black/10 dark:border-white/10 bg-white dark:bg-black/30 text-gray-600 dark:text-gray-300">Tidak ada registrasi pending</div>
        ) : (
          <div className="rounded-lg shadow overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-black/30">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className="bg-gray-50 dark:bg-black/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black/10 divide-y divide-gray-200 dark:divide-white/10">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/10">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-200">{u.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-200">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-200">{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


