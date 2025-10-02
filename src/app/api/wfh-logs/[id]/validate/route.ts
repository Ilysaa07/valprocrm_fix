import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const validateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
})

// POST /api/wfh-logs/:id/validate - admin validate WFH log
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const input = validateSchema.parse(body)

    const wfhLog = await prisma.wfhLog.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!wfhLog) {
      return NextResponse.json({ error: 'Log WFH tidak ditemukan' }, { status: 404 })
    }

    // Check if user already has attendance record for the WFH date
    const wfhDate = new Date(wfhLog.logTime)
    const wfhDateStart = new Date(wfhDate); wfhDateStart.setHours(0,0,0,0)
    const wfhDateEnd = new Date(wfhDate); wfhDateEnd.setHours(23,59,59,999)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: wfhLog.userId,
        checkInTime: {
          gte: wfhDateStart,
          lte: wfhDateEnd
        }
      }
    })

    if (existingAttendance) {
      return NextResponse.json({ 
        error: 'Karyawan sudah memiliki absensi untuk tanggal WFH ini. Tidak dapat menyetujui WFH.' 
      }, { status: 400 })
    }

    // Update WFH log status
    const updatedLog = await prisma.wfhLog.update({
      where: { id: params.id },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
      },
    })

    // If approved, create attendance record
    if (input.status === 'APPROVED') {
      await prisma.attendance.create({
        data: {
          userId: wfhLog.userId,
          checkInTime: wfhLog.logTime,
          status: 'WFH',
          notes: `WFH: ${wfhLog.activityDescription}`,
        },
      })
    }
    
    // If rejected and it's a past date, create absent record
    if (input.status === 'REJECTED') {
      const wfhDate = new Date(wfhLog.logTime)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // If the WFH request was for a past date, mark as absent
      if (wfhDate < today && !existingAttendance) {
        await prisma.attendance.create({
          data: {
            userId: wfhLog.userId,
            checkInTime: wfhLog.logTime,
            status: 'ABSENT',
            notes: `Absent - WFH request rejected`,
          },
        })
      }
    }

    return NextResponse.json({ 
      message: `Log WFH ${input.status === 'APPROVED' ? 'disetujui' : 'ditolak'}`, 
      log: updatedLog 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Validate WFH log error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





