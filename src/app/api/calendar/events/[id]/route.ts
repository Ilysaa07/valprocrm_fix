import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  category: z.enum(['MEETING', 'DEADLINE', 'REMINDER', 'INTERNAL', 'CLIENT', 'PROJECT', 'PERSONAL', 'HOLIDAY']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['CONFIRMED', 'TENTATIVE', 'CANCELLED']).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'CONFIDENTIAL']).optional(),
  recurrenceRule: z.string().optional(),
  recurrenceEnd: z.string().datetime().optional(),
  projectId: z.string().optional(),
  contactId: z.string().optional(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  attendees: z.array(z.object({
    id: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    isOrganizer: z.boolean().default(false),
    status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE']).optional()
  })).optional(),
  reminders: z.array(z.object({
    id: z.string().optional(),
    reminderTime: z.string().datetime(),
    reminderType: z.enum(['NOTIFICATION', 'EMAIL', 'SMS', 'WHATSAPP']).default('NOTIFICATION'),
    message: z.string().optional()
  })).optional()
})

// GET /api/calendar/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = session.user.role === 'ADMIN' ||
      event.createdById === session.user.id ||
      event.visibility === 'PUBLIC' ||
      event.attendees.some(attendee => attendee.userId === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/calendar/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)

    // Check if event exists and user has permission
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: { attendees: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const canEdit = session.user.role === 'ADMIN' ||
      existingEvent.createdById === session.user.id ||
      existingEvent.attendees.some(attendee => 
        attendee.userId === session.user.id && attendee.isOrganizer
      )

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Validate date range if both dates are provided
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)
      
      if (endTime <= startTime) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
      }
    }

    // Update event
    const updateData: any = {
      ...validatedData,
      updatedById: session.user.id
    }

    // Handle date conversions
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime)
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime)
    }
    if (validatedData.recurrenceEnd) {
      updateData.recurrenceEnd = new Date(validatedData.recurrenceEnd)
    }

    // Handle attendees update
    if (validatedData.attendees) {
      // Delete existing attendees and create new ones
      await prisma.eventAttendee.deleteMany({
        where: { eventId: params.id }
      })
      
      updateData.attendees = {
        create: validatedData.attendees.map(attendee => ({
          userId: attendee.userId || null,
          email: attendee.email || null,
          name: attendee.name || null,
          isOrganizer: attendee.isOrganizer || false,
          status: attendee.status || 'PENDING'
        }))
      }
    }

    // Handle reminders update
    if (validatedData.reminders) {
      // Delete existing reminders and create new ones
      await prisma.eventReminder.deleteMany({
        where: { eventId: params.id }
      })
      
      updateData.reminders = {
        create: validatedData.reminders.map(reminder => ({
          reminderTime: new Date(reminder.reminderTime),
          reminderType: reminder.reminderType,
          message: reminder.message
        }))
      }
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedEvent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/calendar/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: { attendees: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const canDelete = session.user.role === 'ADMIN' ||
      existingEvent.createdById === session.user.id ||
      existingEvent.attendees.some(attendee => 
        attendee.userId === session.user.id && attendee.isOrganizer
      )

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete event (cascading deletes will handle attendees and reminders)
    await prisma.calendarEvent.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
