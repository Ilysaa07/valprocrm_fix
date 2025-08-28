import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              total: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    // Calculate totals for summary
    const summary = await prisma.invoice.groupBy({
      by: ['status'],
      _sum: {
        grandTotal: true,
        paidAmount: true,
      },
    })

    const summaryData = {
      total: summary.reduce((acc, item) => acc + Number(item._sum.grandTotal || 0), 0),
      paid: summary.find(item => item.status === 'PAID')?._sum.grandTotal || 0,
      unpaid: summary.find(item => item.status === 'UNPAID')?._sum.grandTotal || 0,
      overdue: summary.find(item => item.status === 'OVERDUE')?._sum.grandTotal || 0,
      partial: summary.find(item => item.status === 'PARTIAL')?._sum.grandTotal || 0,
    }

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: summaryData,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      invoiceNumber,
      issueDate,
      dueDate,
      clientName,
      clientAddress,
      clientEmail,
      clientPhone,
      notes,
      items,
      taxAmount = 0,
      discountAmount = 0,
    } = body

    // Validate required fields
    if (!invoiceNumber || !issueDate || !dueDate || !clientName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    })
    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.total), 0)
    const grandTotal = subtotal + Number(taxAmount) - Number(discountAmount)

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        clientName,
        clientAddress,
        clientEmail,
        clientPhone,
        notes,
        subtotal,
        taxAmount: Number(taxAmount),
        discountAmount: Number(discountAmount),
        grandTotal,
        createdById: session.user.id,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
        },
        history: {
          create: {
            oldStatus: null,
            newStatus: 'UNPAID',
            changedById: session.user.id,
            notes: 'Invoice created',
          },
        },
      },
      include: {
        items: true,
        history: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
