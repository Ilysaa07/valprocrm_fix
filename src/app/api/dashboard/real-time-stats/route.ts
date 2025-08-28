import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simple response for basic stats only
    const isAdmin = session.user.role === 'ADMIN'
    
    // Get basic counts with error handling
    let activeTasks = 0
    let notifications = 0
    let meetings = 0

    try {
      // Count pending tasks
      activeTasks = await prisma.task.count({
        where: {
          ...(isAdmin ? {} : {
            OR: [
              { createdById: session.user.id },
              { assigneeId: session.user.id }
            ]
          }),
          status: { in: ['NOT_STARTED', 'IN_PROGRESS'] }
        }
      })
    } catch (error) {
      console.warn('Error counting tasks:', error)
      activeTasks = 0
    }

    try {
      // Count notifications if table exists
      notifications = await prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false
        }
      })
    } catch (error) {
      console.warn('Notification table not found:', error)
      notifications = 0
    }

    // Meetings placeholder
    meetings = 0

    const stats = {
      activeTasks,
      notifications,
      meetings
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error in real-time stats API:', error)
    // Return default values instead of error
    return NextResponse.json({
      activeTasks: 0,
      notifications: 0,
      meetings: 0
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    // Handle real-time updates (like marking tasks complete, etc.)
    switch (action) {
      case 'mark_task_complete':
        if (data.taskId) {
          await prisma.task.update({
            where: { id: data.taskId },
            data: { status: 'COMPLETED' }
          })
        }
        break
      
      case 'update_project_status':
        if (data.projectId && data.status) {
          await prisma.project.update({
            where: { id: data.projectId },
            data: { status: data.status }
          })
        }
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating real-time stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
