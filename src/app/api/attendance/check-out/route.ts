import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const todayStart = new Date(); todayStart.setHours(0,0,0,0)

    const attendance = await prisma.attendance.findFirst({
      where: { userId: session.user.id, checkInTime: { gte: todayStart } },
      orderBy: { checkInTime: 'desc' }
    })

    if (!attendance || !attendance.checkInTime) {
      return NextResponse.json({ error: 'Belum melakukan check-in' }, { status: 400 })
    }

    if (attendance.checkOutTime) {
      return NextResponse.json({ error: 'Sudah melakukan check-out' }, { status: 400 })
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOutTime: new Date() }
    })

    // Emit socket event for dashboard refresh
    try {
      const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.()
      if (io) io.emit('attendance_updated', { userId: session.user.id, id: updated.id })
    } catch {}

    return NextResponse.json({ message: 'Check-out berhasil', attendance: updated })
  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





