import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/attendance/today - get today's attendance for logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const attendance = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { checkInTime: 'desc' },
      select: {
        id: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
        checkInLatitude: true,
        checkInLongitude: true,
        notes: true
      }
    })

    return NextResponse.json({ data: attendance })
  } catch (error) {
    console.error('Get today attendance error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
