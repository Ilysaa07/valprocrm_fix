import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Maaf, halaman yang Anda cari tidak dapat ditemukan.
          </p>
        </div>
        
        <div className="space-x-4">
          <Link href="/">
            <Button variant="primary">
              Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">
              Dashboard Admin
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
