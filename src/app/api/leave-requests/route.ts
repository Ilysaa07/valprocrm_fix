import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any
    const where: any = { userId: session.user.id }
    if (status) where.status = status
    const items = await prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('leave list error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { type, startDate, endDate, reason } = body
    const lr = await prisma.leaveRequest.create({
      data: {
        userId: session.user.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    })
    try {
      const io = (global as any).io
      if (io) io.emit('leave_request_created', { id: lr.id, userId: lr.userId })
    } catch {}
    return NextResponse.json({ item: lr }, { status: 201 })
  } catch (e) {
    console.error('leave create error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


