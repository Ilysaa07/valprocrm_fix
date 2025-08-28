import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PENDING_VALIDATION']).optional(),
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
      createdBy: task.createdBy
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
    const body = await request.json()
    console.log('Updating task:', id, body)
    
    const validatedData = updateTaskSchema.parse(body)

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tugas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check permission
    if (session.user.role === 'EMPLOYEE') {
      const hasAccess = task.assigneeId === session.user.id || task.assignment === 'ALL_EMPLOYEES'
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Tidak memiliki akses ke tugas ini' },
          { status: 403 }
        )
      }
      
      // Employee can only update status to IN_PROGRESS
      if (Object.keys(validatedData).some(key => key !== 'status')) {
        return NextResponse.json(
          { error: 'Karyawan hanya dapat mengubah status tugas' },
          { status: 403 }
        )
      }
      
      // Employee can only change status to IN_PROGRESS, not to COMPLETED directly
      if (validatedData.status && validatedData.status !== 'IN_PROGRESS' && validatedData.status !== 'NOT_STARTED') {
        return NextResponse.json(
          { error: 'Karyawan hanya dapat mengubah status menjadi Sedang Dikerjakan atau Belum Dikerjakan' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'ADMIN') {
      // Admin can validate tasks (change from PENDING_VALIDATION to COMPLETED)
      if (task.createdById !== session.user.id && !(validatedData.status && task.status === 'PENDING_VALIDATION')) {
        return NextResponse.json(
          { error: 'Hanya pembuat tugas yang dapat mengedit atau admin yang dapat memvalidasi' },
          { status: 403 }
        )
      }
    }

    const updateData: Record<string, any> = {}
    
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.dueDate) updateData.dueDate = new Date(validatedData.dueDate)
    if (validatedData.priority) updateData.priority = validatedData.priority
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.assignment) updateData.assignment = validatedData.assignment
    if (validatedData.assigneeId !== undefined) updateData.assigneeId = validatedData.assigneeId || null
    if (validatedData.tags) updateData.tags = JSON.stringify(validatedData.tags)
    if (validatedData.validationMessage) updateData.validationMessage = validatedData.validationMessage

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
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
        }
      }
    })

    // Transform the updated task to ensure consistent data structure
    const transformedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      assignment: updatedTask.assignment,
      assigneeId: updatedTask.assigneeId,
      assignee: updatedTask.assignee?.fullName || null,
      dueDate: updatedTask.dueDate,
      tags: updatedTask.tags ? JSON.parse(updatedTask.tags) : [],
      createdAt: updatedTask.createdAt,
      createdBy: updatedTask.createdBy
    }

    console.log('Task updated successfully:', transformedTask)

    return NextResponse.json({
      message: 'Tugas berhasil diperbarui',
      task: transformedTask
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
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

