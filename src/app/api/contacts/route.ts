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
    const search = searchParams.get('search') || ''
    const company = searchParams.get('company') || ''
    const status = searchParams.get('status') || ''
    const serviceType = searchParams.get('serviceType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { whatsappNumber: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { instagram: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (company) {
      where.companyName = { contains: company, mode: 'insensitive' }
    }

    if (status) {
      where.clientStatus = status
    }

    if (serviceType) {
      where.serviceType = { contains: serviceType, mode: 'insensitive' }
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true }
          },
          updatedBy: {
            select: { id: true, fullName: true, email: true }
          },
          _count: {
            select: { activityLogs: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.contact.count({ where })
    ])

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      fullName,
      phoneNumber,
      whatsappNumber,
      instagram,
      address,
      companyName,
      position,
      notes,
      clientStatus,
      serviceType,
      followUpDate
    } = body

    // Validation
    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 })
    }

    // Check for duplicate phone/WhatsApp numbers
    if (phoneNumber || whatsappNumber) {
      const existing = await prisma.contact.findFirst({
        where: {
          OR: [
            phoneNumber ? { phoneNumber } : {},
            whatsappNumber ? { whatsappNumber } : {}
          ].filter(Boolean)
        }
      })

      if (existing) {
        return NextResponse.json({ 
          error: 'Nomor telepon atau WhatsApp sudah digunakan' 
        }, { status: 400 })
      }
    }

    const contact = await prisma.contact.create({
      data: {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        whatsappNumber: whatsappNumber?.trim() || null,
        instagram: instagram?.trim() || null,
        address: address?.trim() || null,
        companyName: companyName?.trim() || null,
        position: position?.trim() || null,
        notes: notes?.trim() || null,
        clientStatus: clientStatus || 'PROSPECT',
        serviceType: serviceType?.trim() || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    // Log activity
    await prisma.contactActivity.create({
      data: {
        contactId: contact.id,
        userId: session.user.id,
        action: 'CREATE',
        description: `Kontak baru ditambahkan: ${fullName}`,
        newData: JSON.stringify(contact)
      }
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
