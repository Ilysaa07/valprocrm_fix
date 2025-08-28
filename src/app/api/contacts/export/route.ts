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
    const format = searchParams.get('format') || 'csv'
    const search = searchParams.get('search') || ''
    const company = searchParams.get('company') || ''
    const status = searchParams.get('status') || ''
    const serviceType = searchParams.get('serviceType') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { whatsappNumber: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
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

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        createdBy: {
          select: { fullName: true }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    if (format === 'csv') {
      const csvHeader = [
        'Nama Lengkap',
        'Nomor Telepon',
        'WhatsApp',
        'Instagram',
        'Alamat',
        'Perusahaan',
        'Jabatan',
        'Status Klien',
        'Jenis Layanan',
        'Catatan',
        'Tanggal Follow Up',
        'Dibuat Oleh',
        'Tanggal Dibuat'
      ].join(',')

      const csvRows = contacts.map(contact => [
        `"${contact.fullName}"`,
        `"${contact.phoneNumber || ''}"`,
        `"${contact.whatsappNumber || ''}"`,
        `"${contact.instagram || ''}"`,
        `"${contact.address || ''}"`,
        `"${contact.companyName || ''}"`,
        `"${contact.position || ''}"`,
        `"${contact.clientStatus}"`,
        `"${contact.serviceType || ''}"`,
        `"${contact.notes || ''}"`,
        `"${contact.followUpDate ? new Date(contact.followUpDate).toLocaleDateString('id-ID') : ''}"`,
        `"${contact.createdBy.fullName}"`,
        `"${new Date(contact.createdAt).toLocaleDateString('id-ID')}"`
      ].join(','))

      const csvContent = [csvHeader, ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error exporting contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
