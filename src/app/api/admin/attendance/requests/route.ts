import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/attendance/requests - get all pending leave requests and WFH logs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get pending leave requests
    const pendingLeaveRequests = await prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get pending WFH logs
    const pendingWFHLogs = await prisma.wfhLog.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      leaveRequests: pendingLeaveRequests,
      wfhLogs: pendingWFHLogs,
      totalPending: pendingLeaveRequests.length + pendingWFHLogs.length
    })
  } catch (error) {
    console.error('Get admin requests error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/admin/attendance/requests - approve/reject leave request or WFH log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { type, id, action, adminNotes } = body

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'Type, id, dan action harus disediakan' }, { status: 400 })
    }

    if (type === 'leave') {
      // Handle leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { user: true }
      })

      if (!leaveRequest) {
        return NextResponse.json({ error: 'Permohonan izin tidak ditemukan' }, { status: 404 })
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
      
      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: newStatus,
          adminNotes,
          decidedById: session.user.id,
        },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: leaveRequest.userId,
          title: `Permohonan Izin ${newStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`,
          message: `Permohonan izin Anda untuk ${leaveRequest.type} telah ${newStatus === 'APPROVED' ? 'disetujui' : 'ditolak'}.${adminNotes ? ` Catatan: ${adminNotes}` : ''}`,
        },
      })

      return NextResponse.json({ 
        message: `Permohonan izin ${newStatus === 'APPROVED' ? 'disetujui' : 'ditolak'}`, 
        leaveRequest: updated 
      })

    } else if (type === 'wfh') {
      // Handle WFH log
      const wfhLog = await prisma.wfhLog.findUnique({
        where: { id },
        include: { user: true }
      })

      if (!wfhLog) {
        return NextResponse.json({ error: 'Log WFH tidak ditemukan' }, { status: 404 })
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
      
      const updated = await prisma.wfhLog.update({
        where: { id },
        data: {
          status: newStatus,
          adminNotes,
        },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: wfhLog.userId,
          title: `Log WFH ${newStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`,
          message: `Log WFH Anda pada ${new Date(wfhLog.logTime).toLocaleDateString('id-ID')} telah ${newStatus === 'APPROVED' ? 'disetujui' : 'ditolak'}.${adminNotes ? ` Catatan: ${adminNotes}` : ''}`,
        },
      })

      return NextResponse.json({ 
        message: `Log WFH ${newStatus === 'APPROVED' ? 'disetujui' : 'ditolak'}`, 
        wfhLog: updated 
      })

    } else {
      return NextResponse.json({ error: 'Type tidak valid' }, { status: 400 })
    }

  } catch (error) {
    console.error('Update request error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
