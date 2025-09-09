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
  contactId: z.string().optional(),
  taskId: z.string().optional(),
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
            fullName: true,
            email: true,
            profilePicture: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profilePicture: true
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
            fullName: true,
            phoneNumber: true,
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
            name: true,
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

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 })
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Start and end time are required' }, { status: 400 })
    }

    if (new Date(endTime) <= new Date(startTime)) {
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

    const event = await prisma.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay || false,
        location: location?.trim(),
        meetingLink: meetingLink?.trim(),
        category: category || 'MEETING',
        priority: priority || 'MEDIUM',
        status: status || 'CONFIRMED',
        visibility: visibility || 'PRIVATE',
        recurrenceRule: recurrenceRule?.trim(),
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
        projectId: projectId || null,
        contactId: contactId || null,
        taskId: taskId || null,
        milestoneId: milestoneId || null,
        createdById: session.user.id
      },
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

    // Create attendees
    if (attendees && attendees.length > 0) {
      await prisma.eventAttendee.createMany({
        data: attendees.map((attendee: any) => ({
          eventId: event.id,
          userId: attendee.userId,
          email: attendee.email,
          name: attendee.name,
          isOrganizer: attendee.isOrganizer || false
        }))
      })
    }

    // Create reminders
    if (reminders && reminders.length > 0) {
      await prisma.eventReminder.createMany({
        data: reminders.map((reminder: any) => ({
          eventId: event.id,
          reminderTime: new Date(reminder.reminderTime),
          reminderType: reminder.reminderType || 'NOTIFICATION',
          message: reminder.message
        }))
      })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
