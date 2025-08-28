import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
})

// PUT /api/leave-requests/:id/status - admin approve/reject leave request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const input = updateStatusSchema.parse(body)

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Permohonan izin tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
        decidedById: session.user.id,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: leaveRequest.userId,
        title: `Permohonan Izin ${input.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`,
        message: `Permohonan izin Anda untuk ${leaveRequest.type} telah ${input.status === 'APPROVED' ? 'disetujui' : 'ditolak'}.${input.adminNotes ? ` Catatan: ${input.adminNotes}` : ''}`,
      },
    })

    // Emit socket event for dashboard refresh
    try {
      const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.()
      if (io) io.emit('leave_status_changed', { id, status: input.status })
    } catch {}

    return NextResponse.json({ 
      message: `Permohonan izin ${input.status === 'APPROVED' ? 'disetujui' : 'ditolak'}`, 
      leaveRequest: updated 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Update leave request status error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





