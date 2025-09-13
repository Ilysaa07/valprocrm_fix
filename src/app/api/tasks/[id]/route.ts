import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PENDING_VALIDATION', 'REVISION', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().optional(),
  assignment: z.enum(['SPECIFIC', 'ALL_EMPLOYEES']).optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  validationMessage: z.string().optional(),
})

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
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        submissions: {
          include: {
            user: {
              select: { 
                id: true, 
                fullName: true, 
                email: true, 
                profilePicture: true,
                role: true
              }
            },
            files: {
              select: {
                id: true,
                fileUrl: true,
                fileName: true,
                fileSize: true,
                fileType: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        },
        files: {
          include: {
            document: {
              include: { currentVer: true }
            }
          }
        },
        feedbacks: {
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
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tugas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check access permission
    if (session.user.role === 'EMPLOYEE') {
      const hasAccess = task.assigneeId === session.user.id || task.assignment === 'ALL_EMPLOYEES'
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Tidak memiliki akses ke tugas ini' },
          { status: 403 }
        )
      }
    }

    // Transform the task to ensure consistent data structure
    const transformedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignment: task.assignment,
      assigneeId: task.assigneeId,
      assignee: task.assignee?.fullName || null,
      dueDate: task.dueDate,
      tags: task.tags ? JSON.parse(task.tags) : [],
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      validationMessage: task.validationMessage,
      submissions: task.submissions,
      attachments: task.files.map(f => ({
        id: f.id,
        documentId: f.documentId,
        title: f.document.title,
        url: f.document.currentVer?.fileUrl || null,
        size: f.document.sizeBytes,
        mimeType: f.document.mimeType,
        uploadedAt: f.document.currentVer?.uploadedAt || null
      })),
      feedbacks: task.feedbacks
    }

    return NextResponse.json({ task: transformedTask })

  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true }
        },
        createdBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN'
    const isAssignee = existingTask.assigneeId === session.user.id
    const isCreator = existingTask.createdById === session.user.id
    const isAllEmployeesTask = existingTask.assignment === 'ALL_EMPLOYEES'

    if (!isAdmin && !isAssignee && !isCreator && !isAllEmployeesTask) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true }
        },
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        submissions: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        },
        feedbacks: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignment: updatedTask.assignment,
        assigneeId: updatedTask.assigneeId,
        assignee: updatedTask.assignee,
        dueDate: updatedTask.dueDate,
        tags: updatedTask.tags ? JSON.parse(updatedTask.tags) : [],
        createdAt: updatedTask.createdAt,
        createdBy: updatedTask.createdBy,
        submissions: updatedTask.submissions,
        feedbacks: updatedTask.feedbacks
      }
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
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

    if (task.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'Hanya pembuat tugas yang dapat menghapus' },
        { status: 403 }
      )
    }

    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Tugas berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

