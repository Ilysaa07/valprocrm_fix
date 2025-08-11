import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Judul tugas harus diisi'),
  description: z.string().min(1, 'Deskripsi tugas harus diisi'),
  dueDate: z.string().optional(),
  assignment: z.enum(['SPECIFIC', 'ALL_EMPLOYEES']),
  assigneeId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let where: any = {}

    if (session.user.role === 'EMPLOYEE') {
      // Employee can only see tasks assigned to them or all employees
      where = {
        OR: [
          { assigneeId: session.user.id },
          { assignment: 'ALL_EMPLOYEES' }
        ]
      }
    }

    if (status) {
      where.status = status
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
            where: session.user.role === 'EMPLOYEE' 
              ? { userId: session.user.id }
              : {},
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Validate assignee if specific assignment
    if (validatedData.assignment === 'SPECIFIC' && !validatedData.assigneeId) {
      return NextResponse.json(
        { error: 'Assignee harus dipilih untuk tugas spesifik' },
        { status: 400 }
      )
    }

    if (validatedData.assignment === 'SPECIFIC') {
      const assignee = await prisma.user.findUnique({
        where: { 
          id: validatedData.assigneeId,
          role: 'EMPLOYEE',
          status: 'APPROVED'
        }
      })

      if (!assignee) {
        return NextResponse.json(
          { error: 'Karyawan tidak ditemukan atau belum disetujui' },
          { status: 400 }
        )
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assignment: validatedData.assignment,
        assigneeId: validatedData.assignment === 'SPECIFIC' ? validatedData.assigneeId : null,
        createdById: session.user.id,
      },
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

    // Create notifications
    let notificationUsers: string[] = []
    
    if (validatedData.assignment === 'SPECIFIC' && validatedData.assigneeId) {
      notificationUsers = [validatedData.assigneeId]
    } else {
      // Get all approved employees
      const employees = await prisma.user.findMany({
        where: { 
          role: 'EMPLOYEE',
          status: 'APPROVED'
        },
        select: { id: true }
      })
      notificationUsers = employees.map(emp => emp.id)
    }

    // Create notifications for assigned users
    const notifications = notificationUsers.map(userId => ({
      userId,
      taskId: task.id,
      title: 'Tugas Baru',
      message: `Anda mendapat tugas baru: ${task.title}`
    }))

    await prisma.notification.createMany({
      data: notifications
    })

    return NextResponse.json(
      { 
        message: 'Tugas berhasil dibuat',
        task
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

