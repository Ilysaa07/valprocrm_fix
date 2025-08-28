import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admin or owner can see download history
  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(session.user.role === 'ADMIN' || doc.ownerId === session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const logs = await prisma.documentDownloadLog.findMany({
    where: { documentId: params.id },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { downloadedAt: 'desc' }
  })
  return NextResponse.json({ data: logs })
}


