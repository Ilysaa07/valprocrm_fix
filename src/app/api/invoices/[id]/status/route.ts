import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/invoices/[id]/status - Update invoice status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, paidAmount, notes } = body

    // Validate status
    const validStatuses = ['UNPAID', 'PAID', 'OVERDUE', 'PARTIAL']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current invoice
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const oldStatus = currentInvoice.status
    const newPaidAmount = Number(paidAmount || 0)

    // Validate paid amount
    if (status === 'PAID' && newPaidAmount < currentInvoice.grandTotal) {
      return NextResponse.json(
        { error: 'Paid amount must be equal to or greater than grand total for PAID status' },
        { status: 400 }
      )
    }

    if (status === 'PARTIAL' && newPaidAmount >= currentInvoice.grandTotal) {
      return NextResponse.json(
        { error: 'Paid amount must be less than grand total for PARTIAL status' },
        { status: 400 }
      )
    }

    // Update invoice status and paid amount
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status,
        paidAmount: newPaidAmount,
        updatedById: session.user.id,
      },
    })

    // Record status change in history
    await prisma.invoiceHistory.create({
      data: {
        invoiceId: params.id,
        oldStatus,
        newStatus: status,
        changedById: session.user.id,
        notes: notes || `Status changed from ${oldStatus} to ${status}`,
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
