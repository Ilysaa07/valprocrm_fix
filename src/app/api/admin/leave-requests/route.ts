import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any
    const where: any = {}
    if (status) where.status = status
    const items = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('admin leave list error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


