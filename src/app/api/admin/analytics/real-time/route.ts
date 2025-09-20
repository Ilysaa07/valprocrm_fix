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
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Get real-time data
    const [
      currentAttendance,
      recentTasks,
      recentDocuments,
      recentNotifications,
      systemMetrics
    ] = await Promise.all([
      // Current attendance status
      prisma.attendance.findMany({
        where: {
          checkInTime: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        select: {
          status: true,
          checkInTime: true,
          user: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { checkInTime: 'desc' },
        take: 10
      }),
      
      // Recent task activities
      prisma.task.findMany({
        where: {
          updatedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
          assignee: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),
      
      // Recent document uploads
      prisma.document.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          title: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
          owner: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Recent notifications (if table exists)
      prisma.notification.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }).catch(() => []),
      
      // System metrics (mock data for now)
      Promise.resolve({
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkLatency: Math.random() * 100,
        activeUsers: Math.floor(Math.random() * 50) + 10
      })
    ])

    // Calculate real-time metrics
    const attendanceCounts = currentAttendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const taskStatusCounts = recentTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const documentTypes = recentDocuments.reduce((acc, doc) => {
      const type = doc.mimeType.split('/')[0]
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const realTimeData = {
      timestamp: now.toISOString(),
      
      // Current Status
      currentStatus: {
        attendance: {
          present: attendanceCounts.PRESENT || 0,
          absent: attendanceCounts.ABSENT || 0,
          wfh: attendanceCounts.WFH || 0,
          total: currentAttendance.length
        },
        tasks: {
          completed: taskStatusCounts.COMPLETED || 0,
          inProgress: taskStatusCounts.IN_PROGRESS || 0,
          pending: taskStatusCounts.NOT_STARTED || 0,
          total: recentTasks.length
        },
        documents: {
          uploaded: recentDocuments.length,
          totalSize: recentDocuments.reduce((sum, doc) => sum + doc.sizeBytes, 0),
          types: documentTypes
        }
      },
      
      // Recent Activities
      recentActivities: {
        attendance: currentAttendance.map(record => ({
          id: record.user.email,
          name: record.user.fullName,
          status: record.status,
          time: record.checkInTime,
          type: 'attendance'
        })),
        tasks: recentTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee?.fullName || 'Unassigned',
          time: task.updatedAt,
          type: 'task'
        })),
        documents: recentDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.mimeType.split('/')[0],
          size: doc.sizeBytes,
          owner: doc.owner?.fullName || 'Unknown',
          time: doc.createdAt,
          type: 'document'
        })),
        notifications: recentNotifications.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.isRead,
          time: notif.createdAt,
          type: 'notification'
        }))
      },
      
      // System Metrics
      systemMetrics: {
        performance: {
          cpuUsage: systemMetrics.cpuUsage,
          memoryUsage: systemMetrics.memoryUsage,
          diskUsage: systemMetrics.diskUsage,
          networkLatency: systemMetrics.networkLatency
        },
        activity: {
          activeUsers: systemMetrics.activeUsers,
          totalConnections: systemMetrics.activeUsers + Math.floor(Math.random() * 20)
        }
      },
      
      // Alerts and Warnings
      alerts: [
        ...(attendanceCounts.ABSENT > 5 ? [{
          type: 'warning',
          message: `High absenteeism detected: ${attendanceCounts.ABSENT} employees absent today`,
          timestamp: now.toISOString()
        }] : []),
        ...(taskStatusCounts.IN_PROGRESS > 20 ? [{
          type: 'info',
          message: `High task activity: ${taskStatusCounts.IN_PROGRESS} tasks in progress`,
          timestamp: now.toISOString()
        }] : []),
        ...(systemMetrics.cpuUsage > 80 ? [{
          type: 'error',
          message: `High CPU usage: ${systemMetrics.cpuUsage.toFixed(1)}%`,
          timestamp: now.toISOString()
        }] : [])
      ]
    }

    return NextResponse.json({ 
      data: realTimeData,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Real-time analytics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch real-time analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
