import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admin can access dashboard stats
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Get all stats in parallel for better performance
    const [
      userStats,
      taskStats,
      attendanceStats,
      leaveStats,
      wfhStats
    ] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Task statistics
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true }
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
      })
    ])

    // Process user stats
    const userStatsMap = new Map(userStats.map(stat => [stat.status, stat._count.status]))
    const totalUsers = Array.from(userStatsMap.values()).reduce((sum, count) => sum + count, 0)
    
    // Process task stats
    const taskStatsMap = new Map(taskStats.map(stat => [stat.status, stat._count.status]))
    const totalTasks = Array.from(taskStatsMap.values()).reduce((sum, count) => sum + count, 0)
    
    // Process attendance stats
    const attendanceStatsMap = new Map(attendanceStats.map(stat => [stat.status, stat._count.status]))
    
    // Process leave stats
    const leaveStatsMap = new Map(leaveStats.map(stat => [stat.status, stat._count.status]))
    
    // Process WFH stats
    const wfhStatsMap = new Map(wfhStats.map(stat => [stat.status, stat._count.status]))

    const dashboardStats = {
      // User stats
      totalUsers,
      pendingUsers: userStatsMap.get('PENDING') || 0,
      approvedUsers: userStatsMap.get('APPROVED') || 0,
      rejectedUsers: userStatsMap.get('REJECTED') || 0,
      
      // Task stats
      totalTasks,
      completedTasks: taskStatsMap.get('COMPLETED') || 0,
      pendingTasks: (taskStatsMap.get('NOT_STARTED') || 0) + (taskStatsMap.get('IN_PROGRESS') || 0),
      
      // Attendance stats
      todayPresent: attendanceStatsMap.get('PRESENT') || 0,
      todayAbsent: attendanceStatsMap.get('ABSENT') || 0,
      todayWFH: attendanceStatsMap.get('WFH') || 0,
      
      // Leave stats
      pendingLeaveRequests: leaveStatsMap.get('PENDING') || 0,
      approvedLeaveRequests: leaveStatsMap.get('APPROVED') || 0,
      rejectedLeaveRequests: leaveStatsMap.get('REJECTED') || 0,
      
      // WFH stats
      pendingWFHLogs: wfhStatsMap.get('PENDING') || 0,
      approvedWFHLogs: wfhStatsMap.get('APPROVED') || 0,
      rejectedWFHLogs: wfhStatsMap.get('REJECTED') || 0
    }

    return NextResponse.json({ data: dashboardStats })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
