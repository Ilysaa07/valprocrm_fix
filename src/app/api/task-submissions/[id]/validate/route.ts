import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const validateSubmissionSchema = z.object({
  action: z.enum(['approve', 'reject', 'revise']),
  feedback: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can validate submissions
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const input = validateSubmissionSchema.parse(body)

    // Check if submission exists
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: params.id },
      include: {
        task: true,
        user: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 })
    }

    // We do not track submission status in schema; validation acts on the task

    // Update submission status
    const updatedSubmission = await prisma.taskSubmission.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        task: true
      }
    })

    // Update task status based on validation result
    if (input.action === 'approve') {
      await prisma.task.update({
        where: { id: submission.taskId },
        data: { status: 'COMPLETED' }
      })
    } else if (input.action === 'revise') {
      // If revision requested, set task to REVISION status
      await prisma.task.update({
        where: { id: submission.taskId },
        data: { 
          status: 'REVISION',
          validationMessage: input.feedback || 'Perlu revisi'
        }
      })
    } else {
      // If rejected, set task back to IN_PROGRESS
      await prisma.task.update({
        where: { id: submission.taskId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // Create notification for the submitter
    try {
      const notifTitle = input.action === 'approve' ? 'Tugas Disetujui' : input.action === 'revise' ? 'Revisi Tugas Diminta' : 'Tugas Ditolak'
      const notifMessage = input.action === 'approve'
        ? `Submission Anda untuk "${submission.task.title}" disetujui`
        : input.action === 'revise'
        ? `Submission Anda untuk "${submission.task.title}" diminta revisi`
        : `Submission Anda untuk "${submission.task.title}" ditolak`

      await prisma.notification.create({
        data: {
          userId: submission.userId,
          taskId: submission.taskId,
          title: notifTitle,
          message: notifMessage,
        }
      })

      try {
        const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.()
        if (io) {
          io.to(`user:${submission.userId}`).emit('notification', {
            title: notifTitle,
            message: notifMessage,
          })
        }
      } catch {}
    } catch (e) {
      console.warn('Failed to send submission validation notification:', e)
    }

    // Prepare response message based on action
    let message = '';
    if (input.action === 'approve') {
      message = 'Submission berhasil disetujui';
    } else if (input.action === 'revise') {
      message = 'Submission dikembalikan untuk revisi';
    } else {
      message = 'Submission ditolak';
    }
    
    return NextResponse.json({
      message,
      submission: updatedSubmission
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error validating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
