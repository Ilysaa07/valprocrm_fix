import { NextRequest, NextResponse } from 'next/server'
import { processAllExpiredWFHRequests, getWFHPendingStats } from '@/lib/wfh-cleanup'

/**
 * Cron job endpoint to process expired WFH requests
 * This should be called daily (e.g., at midnight or early morning)
 * 
 * Usage:
 * - Set up a cron job to call this endpoint daily
 * - Or call it manually from admin dashboard
 * - Can be secured with API key if needed
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting WFH cleanup cron job...')
    
    // Optional: Add API key authentication for security
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.CRON_API_KEY
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stats before cleanup
    const statsBefore = await getWFHPendingStats()
    
    // Process all expired WFH requests
    const result = await processAllExpiredWFHRequests()
    
    // Get stats after cleanup
    const statsAfter = await getWFHPendingStats()
    
    const response = {
      success: true,
      message: 'WFH cleanup completed successfully',
      timestamp: new Date().toISOString(),
      results: {
        processedCount: result.processedCount,
        absentRecordsCreated: result.absentRecordsCreated,
        errorsCount: result.errors.length,
        errors: result.errors
      },
      statistics: {
        before: statsBefore,
        after: statsAfter
      }
    }
    
    console.log('WFH cleanup cron job completed:', response)
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('WFH cleanup cron job failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'WFH cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check WFH cleanup status and statistics
 */
export async function GET() {
  try {
    const stats = await getWFHPendingStats()
    
    return NextResponse.json({
      success: true,
      message: 'WFH cleanup statistics retrieved',
      timestamp: new Date().toISOString(),
      statistics: stats
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error getting WFH cleanup stats:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get WFH cleanup statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
