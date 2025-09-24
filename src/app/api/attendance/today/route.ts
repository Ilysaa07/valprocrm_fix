import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isHoliday as checkHoliday } from '@/lib/holidays'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const holidayInfo = checkHoliday(new Date())
    const isHoliday = holidayInfo.isHoliday

    // Get today's attendance record
    let attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })

    // Auto check-out after 16:00 if not checked out yet
    try {
      const now = new Date()
      const cutoff = new Date()
      cutoff.setHours(16, 0, 0, 0)

      if (
        attendance &&
        attendance.checkInTime &&
        !attendance.checkOutTime &&
        now.getTime() >= cutoff.getTime()
      ) {
        const autoCheckoutTime = cutoff
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: { 
            checkOutTime: autoCheckoutTime,
            notes: attendance.notes ? `${attendance.notes} (Auto check-out 16:00)` : 'Auto check-out 16:00'
          }
        })

        // Emit socket event for dashboard refresh (mirrors manual check-out)
        try {
          const { getSocketIO } = await import('@/lib/socket')
          const io = getSocketIO?.()
          if (io) io.emit('attendance_updated', { userId: session.user.id, id: attendance.id })
        } catch {}
      }
    } catch {}

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
      hasWFH: !!wfhLog,
      isHoliday
    })
  } catch (error) {
    console.error('Get today status error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
