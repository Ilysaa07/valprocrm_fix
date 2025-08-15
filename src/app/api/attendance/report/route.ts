import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const from = new Date(searchParams.get('from') || '')
    const to = new Date(searchParams.get('to') || '')
    const userId = searchParams.get('userId') || undefined

    const where: any = {}
    if (userId) where.userId = userId
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) where.checkInAt = { gte: from, lte: to }

    const data = await prisma.attendance.findMany({
      where,
      orderBy: { checkInAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    })

    // Simple aggregation
    const summary = data.reduce(
      (acc, a) => {
        if (a.status === 'LATE') acc.late += 1
        if (!a.checkInAt) acc.absent += 1
        return acc
      },
      { total: data.length, late: 0, absent: 0 }
    )

    return NextResponse.json({ data, summary })
  } catch (e) {
    console.error('report error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


