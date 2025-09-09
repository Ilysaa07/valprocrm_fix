import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Trigger reminders (manual or scheduled via cron hitting this endpoint)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Invoice due reminders (due today or overdue and unpaid/partial)
  const invoices = await prisma.invoice.findMany({
    where: {
      dueDate: { lte: now },
      OR: [{ status: 'UNPAID' }, { status: 'PARTIAL' }]
    },
    include: { createdBy: true }
  })

  for (const inv of invoices) {
    await prisma.notification.create({
      data: {
        userId: inv.createdById,
        title: 'Invoice jatuh tempo',
        message: `Invoice ${inv.invoiceNumber} jatuh tempo / tertunggak.`
      }
    })
  }

  return NextResponse.json({ message: 'Reminders diproses', count: invoices.length })
}


