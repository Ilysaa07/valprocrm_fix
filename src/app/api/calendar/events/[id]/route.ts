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
  contactId: z.string().optional(),
  taskId: z.string().optional(),
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
          select: { id: true, fullName: true, email: true, profilePicture: true }
        },
        attendees: true,
        reminders: true,
        project: { select: { id: true, name: true, status: true } },
        contact: { select: { id: true, fullName: true, companyName: true } },
        task: { select: { id: true, title: true, status: true } },
        milestone: { select: { id: true, name: true, status: true } }
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
    const {
      title,
      description,
      startTime,
      endTime,
      allDay,
      location,
      meetingLink,
      category,
      priority,
      status,
      visibility,
      recurrenceRule,
      recurrenceEnd,
      projectId,
      contactId,
      taskId,
      milestoneId,
      attendees,
      reminders
    } = body

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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 })
    }

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Check if project exists (if specified)
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 400 })
      }
    }

    // Check if contact exists (if specified)
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      })
      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 400 })
      }
    }

    // Check if task exists (if specified)
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      })
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 400 })
      }
    }

    // Check if milestone exists (if specified)
    if (milestoneId) {
      const milestone = await prisma.projectMilestone.findUnique({
        where: { id: milestoneId }
      })
      if (!milestone) {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {
      title: title.trim(),
      description: description?.trim(),
      allDay: allDay || false,
      location: location?.trim(),
      meetingLink: meetingLink?.trim(),
      category: category || 'MEETING',
      priority: priority || 'MEDIUM',
      status: status || 'CONFIRMED',
      visibility: visibility || 'PRIVATE',
      recurrenceRule: recurrenceRule?.trim(),
      projectId: projectId || null,
      contactId: contactId || null,
      taskId: taskId || null,
      milestoneId: milestoneId || null
    }

    if (startTime) updateData.startTime = new Date(startTime)
    if (endTime) updateData.endTime = new Date(endTime)
    if (recurrenceEnd) updateData.recurrenceEnd = new Date(recurrenceEnd)

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        project: {
          select: { id: true, name: true, status: true }
        },
        contact: {
          select: { id: true, fullName: true, companyName: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        milestone: {
          select: { id: true, name: true, status: true }
        }
      }
    })

    // Update attendees if provided
    if (attendees && Array.isArray(attendees)) {
      // Remove existing attendees
      await prisma.eventAttendee.deleteMany({
        where: { eventId: params.id }
      })

      // Add new attendees
      if (attendees.length > 0) {
        await prisma.eventAttendee.createMany({
          data: attendees.map((attendee: any) => ({
            eventId: params.id,
            userId: attendee.userId,
            email: attendee.email,
            name: attendee.name,
            isOrganizer: attendee.isOrganizer || false
          }))
        })
      }
    }

    // Update reminders if provided
    if (reminders && Array.isArray(reminders)) {
      // Remove existing reminders
      await prisma.eventReminder.deleteMany({
        where: { eventId: params.id }
      })

      // Add new reminders
      if (reminders.length > 0) {
        await prisma.eventReminder.createMany({
          data: reminders.map((reminder: any) => ({
            eventId: params.id,
            reminderTime: new Date(reminder.reminderTime),
            reminderType: reminder.reminderType || 'NOTIFICATION',
            message: reminder.message
          }))
        })
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
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

    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: { attendees: true }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const canDelete = session.user.role === 'ADMIN' ||
      event.createdById === session.user.id ||
      event.attendees.some(attendee => 
        attendee.userId === session.user.id && attendee.isOrganizer
      )

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.calendarEvent.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
