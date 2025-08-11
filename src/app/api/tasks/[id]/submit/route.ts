import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitTaskSchema = z.object({
  description: z.string().optional(),
  documentUrl: z.string().optional(),
  documentName: z.string().optional(),
  documentSize: z.number().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = submitTaskSchema.parse(body)

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tugas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check access permission
    const hasAccess = task.assigneeId === session.user.id || task.assignment === 'ALL_EMPLOYEES'
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses ke tugas ini' },
        { status: 403 }
      )
    }

    // Check if already submitted
    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        taskId_userId: {
          taskId: id,
          userId: session.user.id
        }
      }
    })

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.taskSubmission.update({
        where: {
          taskId_userId: {
            taskId: id,
            userId: session.user.id
          }
        },
        data: {
          description: validatedData.description,
          documentUrl: validatedData.documentUrl,
          documentName: validatedData.documentName,
          documentSize: validatedData.documentSize,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      // Update task status to pending validation if not already completed
      if (task.status !== 'COMPLETED' && task.status !== 'PENDING_VALIDATION') {
        await prisma.task.update({
          where: { id },
          data: { status: 'PENDING_VALIDATION' }
        })
      }

      // Create notification for task creator
      await prisma.notification.create({
        data: {
          userId: task.createdById,
          taskId: task.id,
          title: 'Tugas Diperbarui',
          message: `${session.user.name} telah memperbarui pengumpulan tugas "${task.title}"`
        }
      })

      return NextResponse.json({
        message: 'Pengumpulan tugas berhasil diperbarui',
        submission: updatedSubmission
      })
    } else {
      // Create new submission
      const submission = await prisma.taskSubmission.create({
        data: {
          taskId: id,
          userId: session.user.id,
          description: validatedData.description,
          documentUrl: validatedData.documentUrl,
          documentName: validatedData.documentName,
          documentSize: validatedData.documentSize,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      // Update task status to pending validation
      await prisma.task.update({
        where: { id },
        data: { status: 'PENDING_VALIDATION' }
      })

      // Create notification for task creator
      await prisma.notification.create({
        data: {
          userId: task.createdById,
          taskId: task.id,
          title: 'Tugas Menunggu Validasi',
          message: `${session.user.name} telah mengumpulkan tugas "${task.title}" dan menunggu validasi Anda`
        }
      })

      return NextResponse.json({
        message: 'Tugas berhasil dikumpulkan',
        submission
      }, { status: 201 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Submit task error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tugas tidak ditemukan' },
        { status: 404 }
      )
    }

    let where: { taskId: string; userId?: string } = { taskId: id }

    // If employee, only show their own submission
    if (session.user.role === 'EMPLOYEE') {
      const hasAccess = task.assigneeId === session.user.id || task.assignment === 'ALL_EMPLOYEES'
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Tidak memiliki akses ke tugas ini' },
          { status: 403 }
        )
      }
      where.userId = session.user.id
    }

    const submissions = await prisma.taskSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json({ submissions })

  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

