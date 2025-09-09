import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to map milestone status
function mapMilestoneStatus(status: string): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' {
  switch (status.toUpperCase()) {
    case 'PENDING':
    case 'NOT_STARTED':
      return 'NOT_STARTED'
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'OVERDUE':
      return 'OVERDUE'
    default:
      return 'NOT_STARTED'
  }
}

// GET /api/projects - Get all projects with role-based filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const contactId = searchParams.get('contactId') || ''
    const serviceType = searchParams.get('serviceType') || ''
    const memberOnly = searchParams.get('memberOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // Role-based filtering for employees
    if (session.user.role === 'EMPLOYEE' || memberOnly) {
      where.members = {
        some: {
          userId: session.user.id
        }
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serviceType: { contains: search, mode: 'insensitive' } },
        { contact: { fullName: { contains: search, mode: 'insensitive' } } },
        { contact: { companyName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (contactId) {
      where.contactId = contactId
    }

    if (serviceType) {
      where.serviceType = { contains: serviceType, mode: 'insensitive' }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          contact: {
            select: { id: true, fullName: true, companyName: true, clientStatus: true }
          },
          createdBy: {
            select: { id: true, fullName: true, email: true }
          },
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, role: true }
              }
            }
          },
          milestones: {
            orderBy: { order: 'asc' }
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, fullName: true, email: true, role: true }
              },
              createdBy: {
                select: { id: true, fullName: true, email: true }
              },
              milestone: {
                select: { id: true, name: true, status: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { members: true, milestones: true, tasks: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Create new project (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      contactId,
      serviceType,
      startDate,
      endDate,
      notes,
      memberIds = [],
      milestones = [],
      contactManual
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama project wajib diisi' }, { status: 400 })
    }

    let resolvedContactId = contactId
    if (!resolvedContactId && contactManual?.fullName) {
      const created = await prisma.contact.create({
        data: {
          fullName: contactManual.fullName.trim(),
          companyName: contactManual.companyName || null,
          createdById: session.user.id
        }
      })
      resolvedContactId = created.id
    }
    if (!resolvedContactId) {
      return NextResponse.json({ error: 'Klien/Contact wajib dipilih' }, { status: 400 })
    }

    if (!serviceType?.trim()) {
      return NextResponse.json({ error: 'Jenis layanan wajib diisi' }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Tanggal mulai dan selesai wajib diisi' }, { status: 400 })
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: 'Tanggal selesai harus setelah tanggal mulai' }, { status: 400 })
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: resolvedContactId }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact tidak ditemukan' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        contactId: resolvedContactId,
        serviceType: serviceType.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes: notes?.trim() || null,
        createdById: session.user.id
      },
      include: {
        contact: {
          select: { id: true, fullName: true, companyName: true }
        },
        createdBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    // Add project members
    if (memberIds.length > 0) {
      await prisma.projectMember.createMany({
        data: memberIds.map((userId: string, index: number) => ({
          projectId: project.id,
          userId,
          role: index === 0 ? 'Project Manager' : 'Team Member'
        }))
      })
    }

    // Add milestones
    if (Array.isArray(milestones) && milestones.length > 0) {
      const processedMilestones = milestones
        .filter((m: any) => (m.title || m.name))
        .map((m: any, index: number) => ({
          projectId: project.id,
          name: (m.name || m.title || '').toString(),
          description: (m.description || null),
          startDate: new Date(m.startDate || m.dueDate || startDate),
          endDate: new Date(m.endDate || m.dueDate || endDate),
          status: mapMilestoneStatus(m.status || 'PENDING'),
          order: index,
          createdById: session.user.id
        }))

      if (processedMilestones.length > 0) {
        await prisma.projectMilestone.createMany({
          data: processedMilestones
        })
      }
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
