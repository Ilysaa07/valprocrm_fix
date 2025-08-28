import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Judul tugas harus diisi'),
  description: z.string().min(1, 'Deskripsi tugas harus diisi'),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignment: z.enum(['SPECIFIC', 'ALL_EMPLOYEES']),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().optional(),
  contactId: z.string().optional(),
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const assignment = searchParams.get('assignment') || ''
    const projectId = searchParams.get('projectId') || ''
    const contactId = searchParams.get('contactId') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    // Role-based filtering
    if (session.user.role !== 'ADMIN') {
      where.OR = [
        { assigneeId: session.user.id },
        { createdById: session.user.id }
      ]
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignment) where.assignment = assignment
    if (projectId) where.projectId = projectId
    if (contactId) where.contactId = contactId

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, fullName: true, email: true }
          },
          createdBy: {
            select: { id: true, fullName: true, email: true }
          },
          project: {
            select: { id: true, name: true, status: true }
          },
          contact: {
            select: { id: true, fullName: true, companyName: true }
          },
          milestone: {
            select: { id: true, name: true, status: true }
          },
          _count: {
            select: {
              submissions: true,
              feedbacks: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.task.count({ where })
    ])

    // Transform tasks to frontend format
    const transformedTasks = tasks.map(task => ({
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
      project: task.project,
      contact: task.contact,
      milestone: task.milestone,
      submissions: task._count.submissions,
      feedbacks: task._count.feedbacks,
    }))

    return NextResponse.json({
      tasks: transformedTasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    console.log('Creating task with data:', body)
    
    const validatedData = createTaskSchema.parse(body)

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
        priority: validatedData.priority,
        assignment: validatedData.assignment,
        assigneeId: validatedData.assignment === 'SPECIFIC' ? validatedData.assigneeId : null,
        projectId: validatedData.projectId || null,
        contactId: validatedData.contactId || null,
        tags: JSON.stringify(validatedData.tags),
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

    // Transform the created task
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

    console.log('Task created successfully:', transformedTask)

    return NextResponse.json(
      { 
        message: 'Tugas berhasil dibuat',
        task: transformedTask
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
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

