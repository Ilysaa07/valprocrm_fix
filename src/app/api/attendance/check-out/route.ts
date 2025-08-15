import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse request body for location data
    const body = await req.json().catch(() => ({}))
    const { latitude, longitude } = body || {}

    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    // Get user data for notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, fullName: true, email: true }
    })

    const last = await prisma.attendance.findFirst({
      where: { userId: session.user.id, checkInAt: { gte: startOfDay } },
      orderBy: { checkInAt: 'desc' },
    })
    if (!last || last.checkOutAt) return NextResponse.json({ error: 'Not checked in' }, { status: 400 })

    const attendance = await prisma.attendance.update({
      where: { id: last.id },
      data: { 
        checkOutAt: new Date(),
        // Update location data if provided
        ...(latitude && longitude ? { latitude, longitude } : {})
      },
    })

    try {
      const io = (global as any).io
      if (io) {
        // Send more detailed notification with user name
        io.emit('attendance_check_out', { 
          userId: session.user.id, 
          attendanceId: attendance.id,
          userName: user?.fullName || 'Karyawan',
          timestamp: new Date().toISOString()
        })
      }
    } catch {}

    return NextResponse.json({ attendance, user })
  } catch (e) {
    console.error('check-out error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


