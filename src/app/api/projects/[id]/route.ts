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

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        contact: {
          select: { id: true, fullName: true, companyName: true, clientStatus: true, phoneNumber: true, whatsappNumber: true }
        },
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        milestones: {
          include: {
            createdBy: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, fullName: true, email: true }
            },
            createdBy: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })
    }

    // Check if employee has access to this project
    if (session.user.role === 'EMPLOYEE') {
      const isMember = project.members.some(member => member.userId === session.user.id)
      if (!isMember) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
      }
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      serviceType,
      startDate,
      endDate,
      status,
      notes,
      memberIds = [],
      milestones = []
    } = body

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: { members: true }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'EMPLOYEE') {
      const isMember = existingProject.members.some(member => member.userId === session.user.id)
      if (!isMember) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
      }
    }

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama project wajib diisi' }, { status: 400 })
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: 'Tanggal selesai harus setelah tanggal mulai' }, { status: 400 })
    }

    const mapIncomingStatus = (s: string) => {
      if (!s) return undefined
      const map: Record<string, string> = {
        IN_PROGRESS: 'ONGOING',
        PLANNING: 'PLANNING',
        ON_HOLD: 'ON_HOLD',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED'
      }
      return map[s] || s
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      description: description?.trim() || null,
      serviceType: serviceType?.trim(),
      notes: notes?.trim() || null,
      updatedById: session.user.id
    }

    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (status) updateData.status = mapIncomingStatus(status)

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        contact: {
          select: { id: true, fullName: true, companyName: true }
        },
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    // Update members (only admin can do this)
    if (session.user.role === 'ADMIN' && Array.isArray(memberIds)) {
      // Remove existing members
      await prisma.projectMember.deleteMany({
        where: { projectId: id }
      })

      // Add new members
      if (memberIds.length > 0) {
        await prisma.projectMember.createMany({
          data: memberIds.map((userId: string, index: number) => ({
            projectId: id,
            userId,
            role: index === 0 ? 'Project Manager' : 'Team Member'
          }))
        })
      }
    }

    // Update milestones (only admin can do this)
    if (session.user.role === 'ADMIN' && Array.isArray(milestones)) {
      // Remove existing milestones
      await prisma.projectMilestone.deleteMany({
        where: { projectId: id }
      })

      // Add new milestones if any
      if (milestones.length > 0) {
        const processedMilestones = milestones
          .filter((m: any) => (m.title || m.name))
          .map((m: any, index: number) => ({
            projectId: id,
            name: (m.name || m.title || '').toString(),
            description: (m.description || null),
            startDate: new Date(m.startDate || m.dueDate || startDate || new Date()),
            endDate: new Date(m.endDate || m.dueDate || startDate || new Date()),
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
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Project berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
