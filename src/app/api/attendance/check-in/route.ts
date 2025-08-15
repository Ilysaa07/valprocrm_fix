import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { latitude, longitude, ipAddress, method } = await req.json()
    const now = new Date()

    // Get user data for notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, fullName: true, email: true }
    })

    // Load admin config
    const cfg = await prisma.attendanceConfig.findFirst()
    const startHour = cfg?.workStartHour ?? parseInt(process.env.WORK_START_HOUR || '9', 10)
    const start = new Date(now)
    start.setHours(startHour, 0, 0, 0)
    const status = now.getTime() <= start.getTime() ? 'ONTIME' : 'LATE'

    // Geofence validation (if enabled)
    let distanceMeters: number | null = null
    if (cfg?.useGeofence && cfg.officeLat != null && cfg.officeLng != null && cfg.radiusMeters && cfg.radiusMeters > 0) {
      if ((latitude == null || longitude == null) && cfg.enforceGeofence) {
        return NextResponse.json({ error: 'GPS diperlukan untuk check-in di area kantor' }, { status: 400 })
      }
      if (latitude != null && longitude != null) {
        const toRad = (v: number) => (v * Math.PI) / 180
        const R = 6371000 // meters
        const dLat = toRad(latitude - cfg.officeLat!)
        const dLon = toRad(longitude - cfg.officeLng!)
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(cfg.officeLat!)) * Math.cos(toRad(latitude)) * Math.sin(dLon / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distanceMeters = Math.round(R * c)
        if (cfg.enforceGeofence && distanceMeters > cfg.radiusMeters) {
          return NextResponse.json({ error: 'Di luar radius kantor', distanceMeters }, { status: 400 })
        }
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        checkInAt: now,
        method: method === 'GPS' ? 'GPS' : 'IP',
        ipAddress: ipAddress || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        status: status as any,
        notes: distanceMeters != null ? `distance=${distanceMeters}m` : null,
      },
    })

    // Realtime notify admin with user name
    try {
      const io = (global as any).io
      if (io) {
        io.emit('attendance_check_in', { 
          userId: session.user.id, 
          attendanceId: attendance.id, 
          status, 
          distanceMeters,
          userName: user?.fullName || 'Karyawan',
          timestamp: now.toISOString()
        })
      }
    } catch {}

    return NextResponse.json({ attendance, config: cfg ?? null, distanceMeters })
  } catch (e) {
    console.error('check-in error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


