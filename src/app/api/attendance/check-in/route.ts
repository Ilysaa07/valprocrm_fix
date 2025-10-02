import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isHoliday } from '@/lib/holidays'
import { processExpiredWFHRequestsForUser } from '@/lib/wfh-cleanup'
import type { AttendanceStatus as PrismaAttendanceStatus } from '@prisma/client'

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

// Function to determine if check-in is late
function isLateCheckIn(checkInTime: Date): boolean {
  const checkInHour = checkInTime.getHours()
  const checkInMinute = checkInTime.getMinutes()
  
  // Set late threshold to 10:00
  const lateThresholdHour = 10
  const lateThresholdMinute = 0
  
  // Convert to minutes for easier comparison
  const checkInTotalMinutes = checkInHour * 60 + checkInMinute
  const lateThresholdTotalMinutes = lateThresholdHour * 60 + lateThresholdMinute
  
  return checkInTotalMinutes > lateThresholdTotalMinutes
}

// Function to get attendance status based on check-in time
function getAttendanceStatus(checkInTime: Date): PrismaAttendanceStatus {
  return (isLateCheckIn(checkInTime) ? 'LATE' : 'PRESENT') as PrismaAttendanceStatus
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const input = checkInSchema.parse(body)

    // Check today's date range
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)

    // Block check-in on holidays
    const today = new Date()
    const holiday = isHoliday(today)
    if (holiday.isHoliday) {
      return NextResponse.json({ error: `Hari libur${holiday.name ? ` - ${holiday.name}` : ''}. Check-in tidak diperbolehkan.` }, { status: 400 })
    }

    // Check if user already has attendance record today
    const existingAttendance = await prisma.attendance.findFirst({
      where: { 
        userId: session.user.id, 
        checkInTime: { 
          gte: todayStart,
          lte: todayEnd
        } 
      },
    })

    if (existingAttendance) {
      return NextResponse.json({ 
        error: 'Anda sudah melakukan absensi hari ini. Tidak dapat melakukan check-in lagi.' 
      }, { status: 400 })
    }

    // Check if user has WFH log for TODAY only (not previous days)
    const existingWFH = await prisma.wfhLog.findFirst({
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

    if (existingWFH) {
      return NextResponse.json({ 
        error: 'Anda sudah mengajukan atau memiliki WFH hari ini. Tidak dapat melakukan absensi kantor.' 
      }, { status: 400 })
    }

    // Auto-process expired pending WFH requests from previous days
    await processExpiredWFHRequestsForUser(session.user.id)

    // Load latest office location
    const office = await prisma.officeLocation.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!office) return NextResponse.json({ error: 'Lokasi kantor belum dikonfigurasi' }, { status: 400 })

    const distance = haversineMeters(input.latitude, input.longitude, office.latitude, office.longitude)
    if (distance > office.radius) {
      return NextResponse.json({ error: 'Di luar radius kantor' }, { status: 400 })
    }

    // Determine check-in time and status
    const checkInTime = new Date()
    const attendanceStatus = getAttendanceStatus(checkInTime)
    const isLate = isLateCheckIn(checkInTime)
    
    // Prepare notes with late information if applicable
    let notes = input.notes || ''
    if (isLate) {
      const lateTime = checkInTime.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      notes = notes ? `${notes} (Terlambat - Check-in: ${lateTime})` : `Terlambat - Check-in: ${lateTime}`
    }

    const record = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        checkInTime: checkInTime,
        checkInLatitude: input.latitude,
        checkInLongitude: input.longitude,
        status: attendanceStatus,
        notes: notes,
      },
    })

    // Emit socket event for dashboard refresh
    try {
      const { getSocketIO } = await import('@/lib/socket')
      const io = getSocketIO?.()
      if (io) io.emit('attendance_updated', { userId: session.user.id, id: record.id })
    } catch {}

    // Return appropriate message based on status
    const message = isLate 
      ? `Check-in berhasil (Terlambat - ${checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
      : 'Check-in berhasil'

    return NextResponse.json({ 
      message: message, 
      attendance: record,
      isLate: isLate,
      checkInTime: checkInTime.toISOString()
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





