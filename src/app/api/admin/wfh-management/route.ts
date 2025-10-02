import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processAllExpiredWFHRequests, getWFHPendingStats } from '@/lib/wfh-cleanup'

/**
 * Admin endpoint for WFH management and cleanup operations
 */

// GET /api/admin/wfh-management - Get WFH management dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get comprehensive WFH statistics
      const stats = await getWFHPendingStats()
      
      // Get recent WFH requests
      const recentWFH = await prisma.wfhLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      // Get pending WFH requests
      const pendingWFH = await prisma.wfhLog.findMany({
        where: { status: 'PENDING' },
        orderBy: { logTime: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      // Get expired pending requests
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const expiredPending = await prisma.wfhLog.findMany({
        where: {
          status: 'PENDING',
          logTime: { lt: today }
        },
        orderBy: { logTime: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          statistics: stats,
          recentRequests: recentWFH,
          pendingRequests: pendingWFH,
          expiredPendingRequests: expiredPending
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in WFH management GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/wfh-management - Perform WFH management actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action } = body

    if (action === 'cleanup-expired') {
      // Manual cleanup of expired WFH requests
      const result = await processAllExpiredWFHRequests()
      
      return NextResponse.json({
        success: true,
        message: 'Expired WFH requests processed successfully',
        data: result
      })
    }

    if (action === 'bulk-reject-expired') {
      // Bulk reject all expired pending requests
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const expiredRequests = await prisma.wfhLog.findMany({
        where: {
          status: 'PENDING',
          logTime: { lt: today }
        }
      })

      let processedCount = 0
      let absentRecordsCreated = 0

      for (const wfhLog of expiredRequests) {
        const wfhDate = new Date(wfhLog.logTime)
        const wfhDateStart = new Date(wfhDate)
        wfhDateStart.setHours(0, 0, 0, 0)
        const wfhDateEnd = new Date(wfhDate)
        wfhDateEnd.setHours(23, 59, 59, 999)

        // Check if attendance record exists
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            userId: wfhLog.userId,
            checkInTime: {
              gte: wfhDateStart,
              lte: wfhDateEnd
            }
          }
        })

        // Create absent record if none exists
        if (!existingAttendance) {
          await prisma.attendance.create({
            data: {
              userId: wfhLog.userId,
              checkInTime: wfhDateStart,
              status: 'ABSENT',
              notes: `Absent - WFH request expired (bulk rejected by admin)`
            }
          })
          absentRecordsCreated++
        }

        // Reject the WFH request
        await prisma.wfhLog.update({
          where: { id: wfhLog.id },
          data: {
            status: 'REJECTED',
            adminNotes: `Bulk rejected by admin - request expired (original date: ${wfhDate.toDateString()})`
          }
        })

        processedCount++
      }

      return NextResponse.json({
        success: true,
        message: `Bulk rejection completed. Processed ${processedCount} requests, created ${absentRecordsCreated} absent records.`,
        data: {
          processedCount,
          absentRecordsCreated
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in WFH management POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
