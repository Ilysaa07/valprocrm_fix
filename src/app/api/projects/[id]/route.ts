import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
      where: { id: params.id },
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

    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      serviceType: serviceType?.trim(),
      notes: notes?.trim() || null,
      updatedById: session.user.id
    }

    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (status) updateData.status = status

    const project = await prisma.project.update({
      where: { id: params.id },
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
    if (session.user.role === 'ADMIN' && memberIds.length > 0) {
      // Remove existing members
      await prisma.projectMember.deleteMany({
        where: { projectId: params.id }
      })

      // Add new members
      await prisma.projectMember.createMany({
        data: memberIds.map((userId: string, index: number) => ({
          projectId: params.id,
          userId,
          role: index === 0 ? 'Project Manager' : 'Team Member'
        }))
      })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Project berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
