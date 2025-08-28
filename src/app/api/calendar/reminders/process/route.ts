import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReminderService } from '@/lib/calendar/reminder-service'

// POST /api/calendar/reminders/process - Process pending reminders (cron job endpoint)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow system calls or admin users only
    const authHeader = request.headers.get('authorization')
    const isSystemCall = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isAdmin = session?.user?.role === 'ADMIN'
    
    if (!isSystemCall && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await ReminderService.processReminders()
    
    return NextResponse.json({
      message: `Processed ${result.processedCount} of ${result.totalReminders} reminders`,
      ...result
    })
  } catch (error) {
    console.error('Error processing reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/calendar/reminders/process - Get processing status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    
    const upcomingReminders = await ReminderService.getUpcomingReminders(session.user.id, hours)
    
    return NextResponse.json({
      upcomingReminders: upcomingReminders.length,
      reminders: upcomingReminders
    })
  } catch (error) {
    console.error('Error getting reminder status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
