import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createLeaveRequestSchema = z.object({
  type: z.enum(['SICK', 'LEAVE', 'WFH']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(10),
})

// POST /api/leave-requests - employee submit leave request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const input = createLeaveRequestSchema.parse(body)

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: session.user.id,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ message: 'Permohonan izin dibuat', leaveRequest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Create leave request error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// GET /api/leave-requests - admin view all leave requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const leaveRequests = await prisma.leaveRequest.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        decidedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: leaveRequests })
  } catch (error) {
    console.error('Get leave requests error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





