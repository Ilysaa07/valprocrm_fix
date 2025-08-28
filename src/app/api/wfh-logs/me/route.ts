import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wfh-logs/me - get WFH logs for logged-in employee
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const logs = await prisma.wfhLog.findMany({
      where: { userId: session.user.id },
      orderBy: { logTime: 'desc' },
      select: {
        id: true,
        logTime: true,
        activityDescription: true,
        screenshotUrl: true,
        latitude: true,
        longitude: true,
        status: true,
        adminNotes: true,
        leaveRequest: {
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })

    return NextResponse.json({ data: logs })
  } catch (error) {
    console.error('Get WFH logs error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
