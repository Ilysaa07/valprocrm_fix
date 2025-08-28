import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  category: z.enum(['MEETING', 'DEADLINE', 'REMINDER', 'INTERNAL', 'CLIENT', 'PROJECT', 'PERSONAL', 'HOLIDAY']).default('MEETING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['CONFIRMED', 'TENTATIVE', 'CANCELLED']).default('CONFIRMED'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'CONFIDENTIAL']).default('PRIVATE'),
  recurrenceRule: z.string().optional(),
  recurrenceEnd: z.string().datetime().optional(),
  projectId: z.string().optional(),
  contactId: z.string().optional(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  attendees: z.array(z.object({
    userId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    isOrganizer: z.boolean().default(false)
  })).default([]),
  reminders: z.array(z.object({
    reminderTime: z.string().datetime(),
    reminderType: z.enum(['NOTIFICATION', 'EMAIL', 'SMS', 'WHATSAPP']).default('NOTIFICATION'),
    message: z.string().optional()
  })).default([])
})

// GET /api/calendar/events - Get calendar events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const projectId = searchParams.get('projectId')
    const contactId = searchParams.get('contactId')

    const where: any = {}

    // Date range filter
    if (startDate && endDate) {
      where.OR = [
        {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          endTime: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          AND: [
            { startTime: { lte: new Date(startDate) } },
            { endTime: { gte: new Date(endDate) } }
          ]
        }
      ]
    }

    // Category filter
    if (category) {
      where.category = category
    }

    // Project filter
    if (projectId) {
      where.projectId = projectId
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId
    }

    // Role-based access control
    if (session.user.role !== 'ADMIN') {
      where.OR = [
        { createdById: session.user.id },
        { visibility: 'PUBLIC' },
        {
          attendees: {
            some: {
              userId: session.user.id
            }
          }
        }
      ]
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        reminders: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        milestone: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/calendar/events - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    // Validate date range
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)
    
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Create event with attendees and reminders
    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime,
        endTime,
        allDay: validatedData.allDay,
        location: validatedData.location,
        meetingLink: validatedData.meetingLink || null,
        category: validatedData.category,
        priority: validatedData.priority,
        status: validatedData.status,
        visibility: validatedData.visibility,
        recurrenceRule: validatedData.recurrenceRule,
        recurrenceEnd: validatedData.recurrenceEnd ? new Date(validatedData.recurrenceEnd) : null,
        projectId: validatedData.projectId || null,
        contactId: validatedData.contactId || null,
        taskId: validatedData.taskId || null,
        milestoneId: validatedData.milestoneId || null,
        createdById: session.user.id,
        attendees: {
          create: validatedData.attendees.map(attendee => ({
            userId: attendee.userId || null,
            email: attendee.email || null,
            name: attendee.name || null,
            isOrganizer: attendee.isOrganizer,
            status: 'PENDING'
          }))
        },
        reminders: {
          create: validatedData.reminders.map(reminder => ({
            reminderTime: new Date(reminder.reminderTime),
            reminderType: reminder.reminderType,
            message: reminder.message
          }))
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        reminders: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true
          }
        }
      }
    })

    // Create notification for event creation
    await prisma.notification.create({
      data: {
        title: 'New Event Created',
        message: `Event "${event.title}" has been scheduled for ${startTime.toLocaleDateString()}`,
        type: 'CALENDAR',
        userId: session.user.id,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          startTime: startTime.toISOString()
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
