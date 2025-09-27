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
    const limit = parseInt(searchParams.get('limit') || '50') // Increased default limit
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const assignment = searchParams.get('assignment') || ''

    const contactId = searchParams.get('contactId') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    // Role-based filtering
    if (session.user.role !== 'ADMIN') {
      where.OR = [
        { assigneeId: session.user.id },
        { assignment: 'ALL_EMPLOYEES' },
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
          contact: {
            select: { id: true, fullName: true, companyName: true }
          },
          submissions: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true }
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
          },
          files: {
            include: {
              document: {
                include: {
                  currentVer: true
                }
              }
            }
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
      assignee: task.assignee,
      dueDate: task.dueDate,
      tags: task.tags ? JSON.parse(task.tags) : [],
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      project: task.project,
      contact: task.contact,
      milestone: task.milestone,
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
      feedbacks: task.feedbacks,
      _count: task._count
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: Check if user has created too many tasks recently
    const recentTasks = await prisma.task.count({
      where: {
        createdById: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
        }
      }
    })

    // Limit: 20 tasks per hour for admin, 10 for employee
    const maxTasksPerHour = session.user.role === 'ADMIN' ? 20 : 10
    if (recentTasks >= maxTasksPerHour) {
      return NextResponse.json({ 
        error: `Terlalu banyak tugas dibuat. Maksimal ${maxTasksPerHour} tugas per jam.` 
      }, { status: 429 })
    }

    const body = await request.json()
    const {
      title,
      description,
      dueDate,
      priority,
      assignment,
      assigneeId,
      tags,
      projectId,
      contactId,
      milestoneId
    } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Judul tugas wajib diisi' }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Deskripsi tugas wajib diisi' }, { status: 400 })
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Tipe penugasan wajib dipilih' }, { status: 400 })
    }

    if (assignment === 'SPECIFIC' && !assigneeId) {
      return NextResponse.json({ error: 'Assignee wajib dipilih untuk penugasan spesifik' }, { status: 400 })
    }

    // Check if assignee exists (if specified)
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      })
      if (!assignee) {
        return NextResponse.json({ error: 'Assignee tidak ditemukan' }, { status: 400 })
      }
    }

    // Check if project exists (if specified)
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })
      if (!project) {
        return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 400 })
      }
    }

    // Check if milestone exists (if specified)
    if (milestoneId) {
      const milestone = await prisma.projectMilestone.findUnique({
        where: { id: milestoneId }
      })
      if (!milestone) {
        return NextResponse.json({ error: 'Milestone tidak ditemukan' }, { status: 400 })
      }
    }

    // Check if contact exists (if specified)
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      })
      if (!contact) {
        return NextResponse.json({ error: 'Contact tidak ditemukan' }, { status: 400 })
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        assignment,
        assigneeId: assignment === 'SPECIFIC' ? assigneeId : null,
        projectId: projectId || null,
        contactId: contactId || null,
        milestoneId: milestoneId || null,
        tags: JSON.stringify(tags || []),
        createdById: session.user.id
      },
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
        }
      }
    })

    // Create notifications for recipients
    try {
      const recipientIds: string[] = []
      if (assignment === 'ALL_EMPLOYEES') {
        const employees = await prisma.user.findMany({
          where: { role: 'EMPLOYEE' },
          select: { id: true }
        })
        recipientIds.push(...employees.map((e) => e.id))
      } else if (assigneeId) {
        recipientIds.push(assigneeId)
      }

      if (recipientIds.length > 0) {
        await prisma.notification.createMany({
          data: recipientIds.map((uid) => ({
            userId: uid,
            taskId: task.id,
            title: 'Tugas Baru',
            message: `${task.title} telah ditugaskan kepada Anda`,
          }))
        })

        // Emit socket event if server socket available
        try {
          const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.()
          if (io) {
            io.to(recipientIds.map((uid: string) => `user:${uid}`)).emit('notification', {
              title: 'Tugas Baru',
              message: `${task.title} telah ditugaskan kepada Anda`,
            })
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Failed to send task creation notifications:', e)
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

