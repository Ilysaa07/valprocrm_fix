import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Get today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })

    // Get today's WFH log
    const wfhLog = await prisma.wfhLog.findFirst({
      where: {
        userId: session.user.id,
        logTime: {
          gte: todayStart,
          lte: todayEnd
        },
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    })

    return NextResponse.json({
      attendance,
      wfhLog,
      hasAttendance: !!attendance,
      hasWFH: !!wfhLog
    })
  } catch (error) {
    console.error('Get today status error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
