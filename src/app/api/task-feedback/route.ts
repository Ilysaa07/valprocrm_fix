import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createFeedbackSchema = z.object({
  taskId: z.string().min(1, 'Task ID harus diisi'),
  message: z.string().min(1, 'Pesan feedback harus diisi'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, message } = createFeedbackSchema.parse(body)

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })
    }

    // Check if user has permission to add feedback
    const isAssignee = task.assigneeId === session.user.id
    const isCreator = task.createdById === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    const isAllEmployeesTask = task.assignment === 'ALL_EMPLOYEES'

    if (!isAdmin && !isAssignee && !isCreator && !isAllEmployeesTask) {
      return NextResponse.json({ 
        error: 'Anda tidak diizinkan untuk menambahkan feedback untuk task ini' 
      }, { status: 403 })
    }

    // Create feedback
    const feedback = await prisma.taskFeedback.create({
      data: {
        taskId: taskId,
        userId: session.user.id,
        message: message.trim(),
      },
      include: {
        user: {
          select: { 
            id: true, 
            fullName: true, 
            email: true, 
            profilePicture: true,
            role: true
          }
        }
      }
    })

    // Create notifications for related users (assignee and creator, excluding sender)
    try {
      const targetUserIds = new Set<string>()
      if (task.assigneeId && task.assigneeId !== session.user.id) targetUserIds.add(task.assigneeId)
      if (task.createdById && task.createdById !== session.user.id) targetUserIds.add(task.createdById)

      if (targetUserIds.size > 0) {
        await prisma.notification.createMany({
          data: Array.from(targetUserIds).map(uid => ({
            userId: uid,
            taskId: task.id,
            title: 'Feedback Tugas Baru',
            message: `${session.user.name || 'Pengguna'} menambahkan feedback pada tugas: ${task.title}`,
            isRead: false
          }))
        })

        // Emit realtime notification via Socket.IO to each user room
        try {
          const globalWithIo = global as unknown as { io?: { to?: (room: string) => { emit: (evt: string, payload: unknown) => void } } }
          const io = globalWithIo.io
          if (io && typeof io.to === 'function') {
            Array.from(targetUserIds).forEach((uid) => {
              io.to(`user:${uid}`).emit('notification', {
                userId: uid,
                taskId: task.id,
                title: 'Feedback Tugas Baru',
                message: `${session.user.name || 'Pengguna'} menambahkan feedback pada tugas: ${task.title}`,
                createdAt: new Date().toISOString()
              })
            })
          }
        } catch (e) {
          console.error('Failed to emit socket notification:', e)
        }
      }
    } catch (e: unknown) {
      console.error('Failed to create notifications for feedback:', e)
    }

    return NextResponse.json({
      message: 'Feedback berhasil ditambahkan',
      feedback
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating task feedback:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Data tidak valid', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID diperlukan' }, { status: 400 })
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })
    }

    // Check access permission
    const isAssignee = task.assigneeId === session.user.id
    const isCreator = task.createdById === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    const isAllEmployeesTask = task.assignment === 'ALL_EMPLOYEES'

    if (!isAdmin && !isAssignee && !isCreator && !isAllEmployeesTask) {
      return NextResponse.json({ 
        error: 'Anda tidak diizinkan untuk melihat feedback task ini' 
      }, { status: 403 })
    }

    // Get feedbacks for the task with complete user information
    const feedbacks = await prisma.taskFeedback.findMany({
      where: { taskId },
      include: {
        user: {
          select: { 
            id: true, 
            fullName: true, 
            email: true, 
            profilePicture: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ feedbacks })

  } catch (error) {
    console.error('Error fetching task feedbacks:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
