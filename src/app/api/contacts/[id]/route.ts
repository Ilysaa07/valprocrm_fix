import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true }
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Kontak tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get existing contact
    const existingContact = await prisma.contact.findUnique({
      where: { id: params.id }
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Kontak tidak ditemukan' }, { status: 404 })
    }

    // Validation
    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 })
    }

    // Check for duplicate phone/WhatsApp numbers (excluding current contact)
    if (phoneNumber || whatsappNumber) {
      const existing = await prisma.contact.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            {
              OR: [
                phoneNumber ? { phoneNumber } : {},
                whatsappNumber ? { whatsappNumber } : {}
              ].filter(Boolean)
            }
          ]
        }
      })

      if (existing) {
        return NextResponse.json({ 
          error: 'Nomor telepon atau WhatsApp sudah digunakan' 
        }, { status: 400 })
      }
    }

    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
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
        updatedById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    // Log activity
    await prisma.contactActivity.create({
      data: {
        contactId: params.id,
        userId: session.user.id,
        action: 'UPDATE',
        description: `Kontak diperbarui: ${fullName}`,
        oldData: JSON.stringify(existingContact),
        newData: JSON.stringify(updatedContact)
      }
    })

    return NextResponse.json({ contact: updatedContact })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Kontak tidak ditemukan' }, { status: 404 })
    }

    // Log activity before deletion
    await prisma.contactActivity.create({
      data: {
        contactId: params.id,
        userId: session.user.id,
        action: 'DELETE',
        description: `Kontak dihapus: ${contact.fullName}`,
        oldData: JSON.stringify(contact)
      }
    })

    await prisma.contact.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Kontak berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
