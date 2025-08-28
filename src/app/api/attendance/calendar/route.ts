import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  month: z.string().regex(/^\d{1,2}$/).transform(Number),
  year: z.string().regex(/^\d{4}$/).transform(Number),
})

// GET /api/attendance/calendar - get attendance data for specific month/year
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month dan year harus disediakan' }, { status: 400 })
    }

    const input = querySchema.parse({ month, year })

    // Get start and end of month
    const startDate = new Date(input.year, input.month - 1, 1)
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999)

    const attendance = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { checkInTime: 'asc' },
      select: {
        id: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
        notes: true
      }
    })

    // Get leave requests for the month
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: session.user.id,
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        reason: true
      }
    })

    return NextResponse.json({ 
      data: {
        attendance,
        leaveRequests
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Get calendar data error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





