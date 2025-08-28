import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wfh-logs/pending - admin view pending WFH logs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const logs = await prisma.wfhLog.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        leaveRequest: { select: { id: true, type: true, startDate: true, endDate: true } }
      },
      orderBy: { logTime: 'desc' }
    })

    return NextResponse.json({ data: logs })
  } catch (error) {
    console.error('WFH pending error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}




