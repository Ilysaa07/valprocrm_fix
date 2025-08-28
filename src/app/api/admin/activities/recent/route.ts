import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const days = parseInt(searchParams.get('days') || '7')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get recent activities from various sources
    const [
      userActivities,
      taskActivities,
      attendanceActivities,
      leaveActivities,
      wfhActivities
    ] = await Promise.all([
      // User registration activities
      prisma.user.findMany({
        where: {
          createdAt: { gte: startDate }
        },
          select: {
    id: true,
    fullName: true,
    email: true,
    status: true,
    createdAt: true
  },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      
      // Task activities
      prisma.task.findMany({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        },
        select: {
          id: true,
          title: true,
          status: true,
          assigneeId: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            select: { fullName: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      }),
      
      // Attendance activities
      prisma.attendance.findMany({
        where: {
          checkInTime: { gte: startDate }
        },
        select: {
          id: true,
          userId: true,
          status: true,
          checkInTime: true,
          user: {
            select: { fullName: true }
          }
        },
        orderBy: { checkInTime: 'desc' },
        take: limit
      }),
      
      // Leave request activities
      prisma.leaveRequest.findMany({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        },
        select: {
          id: true,
          reason: true,
          status: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { fullName: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      }),
      
      // WFH log activities
      prisma.wfhLog.findMany({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        },
        select: {
          id: true,
          activityDescription: true,
          status: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { fullName: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      })
    ])

    // Combine and format activities
    const activities = [
      ...userActivities.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: `Registrasi Karyawan Baru`,
        description: `${user.fullName} (${user.email}) mendaftar dengan status ${user.status}`,
        timestamp: user.createdAt.toISOString(),
        user: user.fullName,
        icon: 'Users',
        color: 'bg-blue-100 text-blue-800',
        metadata: {
          status: user.status
        }
      })),
      
      ...taskActivities.map(task => ({
        id: `task-${task.id}`,
        type: 'task' as const,
        title: `Tugas ${task.status === 'COMPLETED' ? 'Selesai' : 'Diupdate'}`,
        description: `Tugas "${task.title}" ${task.status === 'COMPLETED' ? 'diselesaikan oleh' : 'diupdate untuk'} ${task.assignee?.fullName || 'Unknown'}`,
        timestamp: task.updatedAt.toISOString(),
        user: task.assignee?.fullName || 'Unknown',
        icon: 'CheckSquare',
        color: 'bg-purple-100 text-purple-800',
        metadata: {
          status: task.status,
          priority: 'medium'
        }
      })),
      
      ...attendanceActivities.map(attendance => ({
        id: `attendance-${attendance.id}`,
        type: 'attendance' as const,
        title: `Absensi ${attendance.status}`,
        description: `${attendance.user?.fullName || 'Unknown'} melakukan absensi dengan status ${attendance.status}`,
        timestamp: attendance.checkInTime.toISOString(),
        user: attendance.user?.fullName || 'Unknown',
        icon: 'Clock',
        color: 'bg-green-100 text-green-800',
        metadata: {
          status: attendance.status
        }
      })),
      
      ...leaveActivities.map(leave => ({
        id: `leave-${leave.id}`,
        type: 'leave' as const,
        title: `Permohonan Izin ${leave.status}`,
        description: `${leave.user?.fullName || 'Unknown'} mengajukan izin: ${leave.reason}`,
        timestamp: leave.updatedAt.toISOString(),
        user: leave.user?.fullName || 'Unknown',
        icon: 'Calendar',
        color: 'bg-indigo-100 text-indigo-800',
        metadata: {
          status: leave.status
        }
      })),
      
      ...wfhActivities.map(wfh => ({
        id: `wfh-${wfh.id}`,
        type: 'wfh' as const,
        title: `Log WFH ${wfh.status}`,
        description: `${wfh.user?.fullName || 'Unknown'} mengirim log WFH: ${wfh.activityDescription}`,
        timestamp: wfh.updatedAt.toISOString(),
        user: wfh.user?.fullName || 'Unknown',
        icon: 'Home',
        color: 'bg-pink-100 text-pink-800',
        metadata: {
          status: wfh.status
        }
      }))
    ]

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({ data: sortedActivities })
  } catch (error) {
    console.error('Recent activities error:', error)
    return NextResponse.json({ error: 'Failed to fetch recent activities' }, { status: 500 })
  }
}
