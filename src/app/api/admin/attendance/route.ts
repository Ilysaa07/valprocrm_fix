import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/attendance - get today's attendance for all employees (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Get all users
    const users = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    })

    // Get today's attendance for all users
    const attendance = await prisma.attendance.findMany({
      where: {
        checkInTime: {
          gte: todayStart,
          lte: todayEnd
        }
      },
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
      orderBy: { checkInTime: 'desc' }
    })

    // Get approved leave requests for today
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      }
    })

    // Get WFH logs for today
    const wfhLogs = await prisma.wfhLog.findMany({
      where: {
        logTime: {
          gte: todayStart,
          lte: todayEnd
        },
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      }
    })

    // Create a map of user attendance status
    const userStatusMap = new Map()
    
    // Initialize all users as absent
    users.forEach(user => {
      userStatusMap.set(user.id, {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        userAvatar: user.profilePicture,
        status: 'ABSENT',
        checkInTime: null,
        checkOutTime: null,
        notes: null,
        type: null
      })
    })

    // Update with actual attendance
    attendance.forEach(record => {
      userStatusMap.set(record.userId, {
        userId: record.userId,
        userName: record.user.fullName,
        userEmail: record.user.email,
        userAvatar: record.user.profilePicture,
        status: record.status,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        notes: record.notes,
        type: null
      })
    })

    // Update with leave requests
    leaveRequests.forEach(leave => {
      userStatusMap.set(leave.userId, {
        userId: leave.userId,
        userName: leave.user.fullName,
        userEmail: leave.user.email,
        userAvatar: leave.user.profilePicture,
        status: 'LEAVE',
        checkInTime: null,
        checkOutTime: null,
        notes: leave.reason,
        type: leave.type
      })
    })

    // Update with WFH logs
    wfhLogs.forEach(wfh => {
      userStatusMap.set(wfh.userId, {
        userId: wfh.userId,
        userName: wfh.user.fullName,
        userEmail: wfh.user.email,
        userAvatar: wfh.user.profilePicture,
        status: 'WFH',
        checkInTime: wfh.logTime,
        checkOutTime: null,
        notes: wfh.activityDescription,
        type: null
      })
    })

    const attendanceData = Array.from(userStatusMap.values())

    // Calculate summary
    const summary = {
      total: users.length,
      present: attendanceData.filter(a => a.status === 'PRESENT').length,
      wfh: attendanceData.filter(a => a.status === 'WFH').length,
      leave: attendanceData.filter(a => a.status === 'LEAVE').length,
      absent: attendanceData.filter(a => a.status === 'ABSENT').length
    }

    return NextResponse.json({ 
      data: attendanceData,
      summary,
      users: users.length
    })
  } catch (error) {
    console.error('Get admin attendance error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
