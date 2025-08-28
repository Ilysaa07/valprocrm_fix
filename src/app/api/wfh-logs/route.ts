import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createLogSchema = z.object({
  activityDescription: z.string().min(3),
  screenshotUrl: z.string().url(),
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





