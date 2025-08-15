import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = new Date(searchParams.get('from') || '')
  const to = new Date(searchParams.get('to') || '')
  const where: any = {}
  if (!isNaN(from.getTime()) && !isNaN(to.getTime())) where.checkInAt = { gte: from, lte: to }

  const rows = await prisma.attendance.findMany({
    where,
    orderBy: { checkInAt: 'desc' },
    include: { user: { select: { fullName: true, email: true } } },
  })

  const data = rows.map((r) => ({
    Nama: r.user.fullName,
    Email: r.user.email,
    'Check-in': r.checkInAt ? new Date(r.checkInAt).toLocaleString() : '-',
    'Check-out': r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : '-',
    Metode: r.method,
    Status: r.status,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="attendance_${Date.now()}.xlsx"`
    }
  })
}


