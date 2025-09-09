import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createLogSchema = z.object({
  activityDescription: z.string().min(3),
  // Accept absolute or relative URLs (e.g., /uploads/...) instead of enforcing full URL
  screenshotUrl: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  leaveRequestId: z.string().optional(),
})

// POST /api/wfh-logs - employee submit WFH activity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const input = createLogSchema.parse(body)

    // Check today's date range
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)

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
        error: 'Anda sudah melakukan absensi kantor hari ini. Tidak dapat mengajukan WFH.' 
      }, { status: 400 })
    }

    // Check if user already has WFH log today
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
        error: 'Anda sudah mengajukan WFH hari ini. Tidak dapat mengajukan lagi.' 
      }, { status: 400 })
    }

    const log = await prisma.wfhLog.create({
      data: {
        userId: session.user.id,
        leaveRequestId: input.leaveRequestId,
        logTime: new Date(),
        activityDescription: input.activityDescription,
        screenshotUrl: input.screenshotUrl,
        latitude: input.latitude,
        longitude: input.longitude,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ message: 'Log WFH dibuat', log }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Create WFH log error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





