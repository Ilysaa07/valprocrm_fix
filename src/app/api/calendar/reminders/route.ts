import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/calendar/reminders - Get pending reminders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const now = new Date()
    const where: any = {
      isSent: false,
      event: {
        OR: [
          { createdById: session.user.id },
          {
            attendees: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    }

    if (upcoming) {
      // Get reminders for next 24 hours
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      where.reminderTime = {
        gte: now,
        lte: tomorrow
      }
    } else {
      // Get overdue reminders
      where.reminderTime = {
        lte: now
      }
    }

    const reminders = await prisma.eventReminder.findMany({
      where,
      include: {
        event: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            },
            contact: {
              select: {
                id: true,
                name: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        reminderTime: 'asc'
      },
      take: limit
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/calendar/reminders/process - Process and send reminders
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Get all unsent reminders that are due
    const dueReminders = await prisma.eventReminder.findMany({
      where: {
        isSent: false,
        reminderTime: {
          lte: now
        }
      },
      include: {
        event: {
          include: {
            createdBy: true,
            attendees: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    let processedCount = 0

    for (const reminder of dueReminders) {
      try {
        // Create notifications for event creator and attendees
        const recipients = [reminder.event.createdBy]
        
        // Add attendees who are users
        reminder.event.attendees.forEach(attendee => {
          if (attendee.user && attendee.user.id !== reminder.event.createdBy.id) {
            recipients.push(attendee.user)
          }
        })

        // Create notifications
        for (const recipient of recipients) {
          await prisma.notification.create({
            data: {
              title: `Event Reminder: ${reminder.event.title}`,
              message: reminder.message || `Don't forget about "${reminder.event.title}" scheduled for ${reminder.event.startTime.toLocaleString()}`,
              type: 'CALENDAR',
              priority: reminder.event.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
              userId: recipient.id,
              metadata: {
                eventId: reminder.event.id,
                eventTitle: reminder.event.title,
                startTime: reminder.event.startTime.toISOString(),
                reminderType: reminder.reminderType
              }
            }
          })
        }

        // Mark reminder as sent
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: {
            isSent: true,
            sentAt: now
          }
        })

        processedCount++
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error)
      }
    }

    return NextResponse.json({ 
      message: `Processed ${processedCount} reminders`,
      processedCount 
    })
  } catch (error) {
    console.error('Error processing reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
