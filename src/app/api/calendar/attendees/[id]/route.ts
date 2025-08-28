import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAttendeeSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE'])
})

// PUT /api/calendar/attendees/[id] - Update attendee status
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
    const { status } = updateAttendeeSchema.parse(body)

    // Check if attendee exists and user has permission to update
    const attendee = await prisma.eventAttendee.findUnique({
      where: { id: params.id },
      include: {
        event: {
          include: {
            createdBy: true
          }
        },
        user: true
      }
    })

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    // User can update their own attendance or admin can update any
    const canUpdate = session.user.role === 'ADMIN' ||
      attendee.userId === session.user.id ||
      attendee.event.createdById === session.user.id

    if (!canUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update attendee status
    const updatedAttendee = await prisma.eventAttendee.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startTime: true
          }
        }
      }
    })

    // Create notification for event creator if attendee responded
    if (attendee.userId !== attendee.event.createdById) {
      const statusText = status.toLowerCase()
      await prisma.notification.create({
        data: {
          title: `Event Response: ${attendee.event.title}`,
          message: `${attendee.user?.name || attendee.name || attendee.email} has ${statusText} the event invitation`,
          type: 'CALENDAR',
          userId: attendee.event.createdById,
          metadata: {
            eventId: attendee.event.id,
            attendeeId: attendee.id,
            attendeeStatus: status
          }
        }
      })
    }

    return NextResponse.json(updatedAttendee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating attendee status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
