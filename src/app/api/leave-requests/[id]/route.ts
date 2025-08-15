import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { action, notes } = await req.json()
    if (!['approve','reject'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const lr = await prisma.leaveRequest.update({
      where: { id },
      data: { status: status as any, decidedById: session.user.id, decidedAt: new Date() },
    })
    try {
      const io = (global as any).io
      if (io) io.to(`user:${lr.userId}`).emit('leave_request_updated', { id: lr.id, status })
    } catch {}
    return NextResponse.json({ item: lr })
  } catch (e) {
    console.error('leave update error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


