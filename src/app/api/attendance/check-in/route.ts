import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
})

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const input = checkInSchema.parse(body)

    // Ensure not already checked-in today
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const existing = await prisma.attendance.findFirst({
      where: { userId: session.user.id, checkInTime: { gte: todayStart } },
    })
    if (existing?.checkInTime) {
      return NextResponse.json({ error: 'Sudah melakukan check-in hari ini' }, { status: 400 })
    }

    // Load latest office location
    const office = await prisma.officeLocation.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!office) return NextResponse.json({ error: 'Lokasi kantor belum dikonfigurasi' }, { status: 400 })

    const distance = haversineMeters(input.latitude, input.longitude, office.latitude, office.longitude)
    if (distance > office.radius) {
      return NextResponse.json({ error: 'Di luar radius kantor' }, { status: 400 })
    }

    const record = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        checkInTime: new Date(),
        checkInLatitude: input.latitude,
        checkInLongitude: input.longitude,
        status: 'PRESENT',
        notes: input.notes,
      },
    })

    // Emit socket event for dashboard refresh
    try {
      const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.()
      if (io) io.emit('attendance_updated', { userId: session.user.id, id: record.id })
    } catch {}

    return NextResponse.json({ message: 'Check-in berhasil', attendance: record }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





