import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      name,
      description,
      startDate,
      endDate,
      order = 0
    } = body

    // Validation
    if (!projectId || !name?.trim()) {
      return NextResponse.json({ error: 'Project ID dan nama milestone wajib diisi' }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Tanggal mulai dan selesai wajib diisi' }, { status: 400 })
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: 'Tanggal selesai harus setelah tanggal mulai' }, { status: 400 })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'EMPLOYEE') {
      const isMember = project.members.some(member => member.userId === session.user.id)
      if (!isMember) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
      }
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        order,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true }
        }
      }
    })

    return NextResponse.json({ milestone }, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { milestones } = body

    if (!Array.isArray(milestones)) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    // Update multiple milestones (for drag-and-drop reordering)
    const updatePromises = milestones.map((milestone: any) => 
      prisma.projectMilestone.update({
        where: { id: milestone.id },
        data: {
          startDate: new Date(milestone.startDate),
          endDate: new Date(milestone.endDate),
          order: milestone.order,
          status: milestone.status
        }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Milestones berhasil diperbarui' })
  } catch (error) {
    console.error('Error updating milestones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
