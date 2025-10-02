/**
 * WFH Cleanup Service
 * Handles automatic processing of expired pending WFH requests
 */

import { prisma } from '@/lib/prisma'

export interface WFHCleanupResult {
  processedCount: number
  absentRecordsCreated: number
  errors: string[]
}

/**
 * Process all expired pending WFH requests across all users
 * This should be called by a cron job or scheduled task
 */
export async function processAllExpiredWFHRequests(): Promise<WFHCleanupResult> {
  const result: WFHCleanupResult = {
    processedCount: 0,
    absentRecordsCreated: 0,
    errors: []
  }

  try {
    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Find all pending WFH requests from previous days (before today)
    const expiredPendingWFH = await prisma.wfhLog.findMany({
      where: {
        status: 'PENDING',
        logTime: {
          lt: todayStart // Before today
        }
      },
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

    console.log(`Found ${expiredPendingWFH.length} expired pending WFH requests`)

    for (const wfhLog of expiredPendingWFH) {
      try {
        const wfhDate = new Date(wfhLog.logTime)
        const wfhDateStart = new Date(wfhDate)
        wfhDateStart.setHours(0, 0, 0, 0)
        const wfhDateEnd = new Date(wfhDate)
        wfhDateEnd.setHours(23, 59, 59, 999)

        // Check if there's already an attendance record for that day
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            userId: wfhLog.userId,
            checkInTime: {
              gte: wfhDateStart,
              lte: wfhDateEnd
            }
          }
        })

        // If no attendance record exists, create an ABSENT record
        if (!existingAttendance) {
          await prisma.attendance.create({
            data: {
              userId: wfhLog.userId,
              checkInTime: wfhDateStart,
              status: 'ABSENT',
              notes: `Absent - WFH request expired (was pending for ${wfhDate.toDateString()})`
            }
          })
          result.absentRecordsCreated++
        }

        // Mark the WFH request as expired/rejected
        await prisma.wfhLog.update({
          where: { id: wfhLog.id },
          data: {
            status: 'REJECTED',
            adminNotes: `Auto-rejected: Request expired (not processed within the day). Original request date: ${wfhDate.toDateString()}`
          }
        })

        result.processedCount++
        console.log(`Processed expired WFH request for user ${wfhLog.user.fullName} (${wfhLog.user.email}) for date ${wfhDate.toDateString()}`)

      } catch (error) {
        const errorMsg = `Error processing WFH request ${wfhLog.id} for user ${wfhLog.user.fullName}: ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    console.log(`WFH cleanup completed. Processed: ${result.processedCount}, Absent records created: ${result.absentRecordsCreated}, Errors: ${result.errors.length}`)
    return result

  } catch (error) {
    const errorMsg = `Fatal error in WFH cleanup process: ${error}`
    console.error(errorMsg)
    result.errors.push(errorMsg)
    return result
  }
}

/**
 * Process expired pending WFH requests for a specific user
 * This is called during check-in to ensure user's past requests are cleaned up
 */
export async function processExpiredWFHRequestsForUser(userId: string): Promise<WFHCleanupResult> {
  const result: WFHCleanupResult = {
    processedCount: 0,
    absentRecordsCreated: 0,
    errors: []
  }

  try {
    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Find pending WFH requests from previous days (before today) for this user
    const expiredPendingWFH = await prisma.wfhLog.findMany({
      where: {
        userId: userId,
        status: 'PENDING',
        logTime: {
          lt: todayStart // Before today
        }
      }
    })

    for (const wfhLog of expiredPendingWFH) {
      try {
        const wfhDate = new Date(wfhLog.logTime)
        const wfhDateStart = new Date(wfhDate)
        wfhDateStart.setHours(0, 0, 0, 0)
        const wfhDateEnd = new Date(wfhDate)
        wfhDateEnd.setHours(23, 59, 59, 999)

        // Check if there's already an attendance record for that day
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            userId: userId,
            checkInTime: {
              gte: wfhDateStart,
              lte: wfhDateEnd
            }
          }
        })

        // If no attendance record exists, create an ABSENT record
        if (!existingAttendance) {
          await prisma.attendance.create({
            data: {
              userId: userId,
              checkInTime: wfhDateStart,
              status: 'ABSENT',
              notes: `Absent - WFH request expired (was pending)`
            }
          })
          result.absentRecordsCreated++
        }

        // Mark the WFH request as expired/rejected
        await prisma.wfhLog.update({
          where: { id: wfhLog.id },
          data: {
            status: 'REJECTED',
            adminNotes: 'Auto-rejected: Request expired (not processed within the day)'
          }
        })

        result.processedCount++

      } catch (error) {
        const errorMsg = `Error processing WFH request ${wfhLog.id}: ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    return result

  } catch (error) {
    const errorMsg = `Error in user WFH cleanup process: ${error}`
    console.error(errorMsg)
    result.errors.push(errorMsg)
    return result
  }
}

/**
 * Get statistics about pending WFH requests
 */
export async function getWFHPendingStats() {
  try {
    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const stats = await prisma.wfhLog.groupBy({
      by: ['status'],
      where: {
        logTime: {
          lt: todayStart // Before today
        }
      },
      _count: {
        status: true
      }
    })

    const pendingCount = stats.find(s => s.status === 'PENDING')?._count.status || 0
    
    return {
      expiredPendingCount: pendingCount,
      totalExpiredRequests: stats.reduce((sum, s) => sum + s._count.status, 0)
    }

  } catch (error) {
    console.error('Error getting WFH pending stats:', error)
    return {
      expiredPendingCount: 0,
      totalExpiredRequests: 0
    }
  }
}
