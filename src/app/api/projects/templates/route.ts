import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType') || ''

    const where: any = {}
    if (serviceType) {
      where.serviceType = { contains: serviceType, mode: 'insensitive' }
    }

    const templates = await prisma.projectTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching project templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, serviceType, milestones } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama template wajib diisi' }, { status: 400 })
    }

    if (!serviceType?.trim()) {
      return NextResponse.json({ error: 'Jenis layanan wajib diisi' }, { status: 400 })
    }

    if (!Array.isArray(milestones) || milestones.length === 0) {
      return NextResponse.json({ error: 'Minimal satu milestone wajib diisi' }, { status: 400 })
    }

    const template = await prisma.projectTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        serviceType: serviceType.trim(),
        milestones: JSON.stringify(milestones),
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating project template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
