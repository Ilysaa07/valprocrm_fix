import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/leave-requests/me - employee view own leave requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { userId: session.user.id },
      include: {
        decidedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: leaveRequests })
  } catch (error) {
    console.error('Get leave requests error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





