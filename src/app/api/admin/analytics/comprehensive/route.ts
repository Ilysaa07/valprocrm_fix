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
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Get comprehensive analytics data in parallel
    const [
      userStats,
      taskStats,
      attendanceStats,
      leaveStats,
      wfhStats,
      documentStats,
      transactionStats,
      systemStats
    ] = await Promise.all([
      // User statistics with detailed breakdown
      prisma.user.groupBy({
        by: ['status', 'role'],
        _count: { id: true }
      }),
      
      // Task statistics with priority and status
      prisma.task.groupBy({
        by: ['status', 'priority'],
        _count: { id: true }
      }),
      
      // Today's attendance statistics
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          checkInTime: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        _count: { status: true }
      }),
      
      // Leave request statistics
      prisma.leaveRequest.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // WFH log statistics
      prisma.wfhLog.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Document statistics
      prisma.document.aggregate({
        where: { isArchived: false },
        _count: { id: true },
        _sum: { sizeBytes: true }
      }),
      
      // Transaction statistics (if available)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true }
      }).catch(() => ({ _sum: { amount: 0 }, _count: { id: 0 } })),
      
      // System performance metrics (mock data for now)
      Promise.resolve({
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1,
        activeConnections: 45
      })
    ])

    // Process user stats
    const userStatsMap = new Map()
    userStats.forEach(stat => {
      const key = `${stat.status}-${stat.role}`
      userStatsMap.set(key, stat._count.id)
    })
    
    const totalUsers = Array.from(userStatsMap.values()).reduce((sum, count) => sum + count, 0)
    const adminUsers = userStatsMap.get('APPROVED-ADMIN') || 0
    const employeeUsers = userStatsMap.get('APPROVED-EMPLOYEE') || 0
    const pendingUsers = userStatsMap.get('PENDING-EMPLOYEE') || 0 + userStatsMap.get('PENDING-ADMIN') || 0

    // Process task stats
    const taskStatsMap = new Map()
    taskStats.forEach(stat => {
      const key = `${stat.status}-${stat.priority}`
      taskStatsMap.set(key, stat._count.id)
    })
    
    const totalTasks = Array.from(taskStatsMap.values()).reduce((sum, count) => sum + count, 0)
    const completedTasks = taskStatsMap.get('COMPLETED-HIGH') || 0 + taskStatsMap.get('COMPLETED-MEDIUM') || 0 + taskStatsMap.get('COMPLETED-LOW') || 0
    const highPriorityTasks = taskStatsMap.get('IN_PROGRESS-HIGH') || 0 + taskStatsMap.get('NOT_STARTED-HIGH') || 0

    // Process attendance stats
    const attendanceStatsMap = new Map(attendanceStats.map(stat => [stat.status, stat._count.status]))
    const presentToday = attendanceStatsMap.get('PRESENT') || 0
    const absentToday = attendanceStatsMap.get('ABSENT') || 0
    const wfhToday = attendanceStatsMap.get('WFH') || 0

    // Process leave stats
    const leaveStatsMap = new Map(leaveStats.map(stat => [stat.status, stat._count.status]))
    const pendingLeaveRequests = leaveStatsMap.get('PENDING') || 0

    // Process WFH stats
    const wfhStatsMap = new Map(wfhStats.map(stat => [stat.status, stat._count.status]))
    const pendingWFHLogs = wfhStatsMap.get('PENDING') || 0

    // Calculate derived metrics
    const attendanceRate = totalUsers > 0 ? ((presentToday + wfhToday) / totalUsers) * 100 : 0
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const pendingRequests = pendingLeaveRequests + pendingWFHLogs

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivities = await Promise.all([
      prisma.attendance.count({
        where: { checkInTime: { gte: sevenDaysAgo } }
      }),
      prisma.task.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.document.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.leaveRequest.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      })
    ])

    // Get monthly trends for the last 6 months
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
      
      const monthAttendance = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
          checkInTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _count: { status: true }
      })

      const present = monthAttendance.find(a => a.status === 'PRESENT')?._count.status || 0
      const absent = monthAttendance.find(a => a.status === 'ABSENT')?._count.status || 0
      const wfh = monthAttendance.find(a => a.status === 'WFH')?._count.status || 0

      monthlyTrends.push({
        month: startOfMonth.toLocaleDateString('id-ID', { month: 'short' }),
        present,
        absent,
        wfh,
        leave: 0 // This would need to be calculated from leave requests
      })
    }

    const comprehensiveAnalytics = {
      // User Analytics
      users: {
        total: totalUsers,
        active: presentToday + wfhToday,
        pending: pendingUsers,
        approved: totalUsers - pendingUsers,
        admins: adminUsers,
        employees: employeeUsers,
        attendanceRate: attendanceRate
      },
      
      // Task Analytics
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        highPriority: highPriorityTasks,
        completionRate: taskCompletionRate
      },
      
      // Attendance Analytics
      attendance: {
        presentToday,
        absentToday,
        wfhToday,
        leaveToday: 0,
        totalToday: presentToday + absentToday + wfhToday
      },
      
      // Request Analytics
      requests: {
        pending: pendingRequests,
        leavePending: pendingLeaveRequests,
        wfhPending: pendingWFHLogs
      },
      
      // Document Analytics
      documents: {
        total: documentStats._count.id,
        totalSize: documentStats._sum.sizeBytes || 0,
        recentUploads: recentActivities[2]
      },
      
      // Financial Analytics
      financial: {
        totalTransactions: transactionStats._count.id,
        totalAmount: transactionStats._sum.amount || 0
      },
      
      // System Analytics
      system: {
        uptime: systemStats.uptime,
        responseTime: systemStats.responseTime,
        errorRate: systemStats.errorRate,
        activeConnections: systemStats.activeConnections
      },
      
      // Recent Activity
      recentActivity: {
        attendance: recentActivities[0],
        tasks: recentActivities[1],
        documents: recentActivities[2],
        leaveRequests: recentActivities[3]
      },
      
      // Trends
      trends: {
        monthly: monthlyTrends
      }
    }

    return NextResponse.json({ 
      data: comprehensiveAnalytics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Comprehensive analytics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch comprehensive analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
