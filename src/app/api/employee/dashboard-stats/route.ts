import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get employee stats with proper error handling
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      todayAttendance,
      pendingLeaveRequests,
      approvedLeaveRequests,
      rejectedLeaveRequests,
      pendingWFHLogs,
      approvedWFHLogs,
      rejectedWFHLogs,
      recentActivities
    ] = await Promise.allSettled([
      prisma.task.count({
        where: {
          OR: [
            { assigneeId: userId },
            { assignment: 'ALL_EMPLOYEES' }
          ]
        }
      }),
      prisma.task.count({
        where: { 
          OR: [
            { assigneeId: userId },
            { assignment: 'ALL_EMPLOYEES' }
          ],
          status: 'COMPLETED'
        }
      }),
      prisma.task.count({
        where: { 
          OR: [
            { assigneeId: userId },
            { assignment: 'ALL_EMPLOYEES' }
          ],
          status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_VALIDATION', 'REVISION'] }
        }
      }),
      prisma.attendance.findFirst({
        where: {
          userId: userId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.leaveRequest.count({
        where: { 
          userId: userId,
          status: 'PENDING'
        }
      }),
      prisma.leaveRequest.count({
        where: { 
          userId: userId,
          status: 'APPROVED'
        }
      }),
      prisma.leaveRequest.count({
        where: { 
          userId: userId,
          status: 'REJECTED'
        }
      }),
      prisma.wfhLog.count({
        where: { 
          userId: userId,
          status: 'PENDING'
        }
      }),
      prisma.wfhLog.count({
        where: { 
          userId: userId,
          status: 'APPROVED'
        }
      }),
      prisma.wfhLog.count({
        where: { 
          userId: userId,
          status: 'REJECTED'
        }
      }),
      prisma.contactActivity.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          description: true,
          createdAt: true
        }
      })
    ])

    // Helper function to safely extract values from Promise.allSettled results
    const getValue = (result: PromiseSettledResult<any>, defaultValue: any = 0) => {
      return result.status === 'fulfilled' ? result.value : defaultValue
    }

    const stats = {
      totalTasks: getValue(totalTasks, 0),
      completedTasks: getValue(completedTasks, 0),
      pendingTasks: getValue(pendingTasks, 0),
      todayPresent: getValue(todayAttendance) ? 1 : 0,
      todayAbsent: getValue(todayAttendance) ? 0 : 1,
      todayWFH: 0, // This would need additional logic based on your WFH tracking
      pendingLeaveRequests: getValue(pendingLeaveRequests, 0),
      approvedLeaveRequests: getValue(approvedLeaveRequests, 0),
      rejectedLeaveRequests: getValue(rejectedLeaveRequests, 0),
      pendingWFHLogs: getValue(pendingWFHLogs, 0),
      approvedWFHLogs: getValue(approvedWFHLogs, 0),
      rejectedWFHLogs: getValue(rejectedWFHLogs, 0),
      recentActivities: getValue(recentActivities, [])
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Employee dashboard stats error:', error)
    
    // Return safe default data on error
    const defaultStats = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      todayPresent: 0,
      todayAbsent: 0,
      todayWFH: 0,
      pendingLeaveRequests: 0,
      approvedLeaveRequests: 0,
      rejectedLeaveRequests: 0,
      pendingWFHLogs: 0,
      approvedWFHLogs: 0,
      rejectedWFHLogs: 0,
      recentActivities: []
    }

    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data dashboard',
      data: defaultStats
    }, { status: 200 }) // Return 200 with default data instead of 500
  }
}
