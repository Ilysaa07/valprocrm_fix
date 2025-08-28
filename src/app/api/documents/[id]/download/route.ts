import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { createReadStream, existsSync } from 'fs'

function canView(userId: string, role: string | null | undefined, doc: any) {
  if (role === 'ADMIN') return true
  if (doc.visibility === 'PUBLIC') return true
  if (doc.ownerId === userId) return true
  if (doc.acls?.some((a: any) => a.userId === userId && a.canView)) return true
  if (doc.acls?.some((a: any) => a.role === role && a.canView)) return true
  return false
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: { currentVer: true, acls: true }
  })
  if (!doc || !doc.currentVer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!canView(session.user.id, session.user.role, doc)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.documentDownloadLog.create({
    data: { documentId: doc.id, userId: session.user.id }
  })

  const storageDir = join(process.cwd(), 'storage', 'documents')
  const filePath = join(storageDir, doc.currentVer.fileUrl)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File missing' }, { status: 404 })
  }

  const stream = createReadStream(filePath)
  const { searchParams } = new URL(req.url)
  const asInline = searchParams.get('inline') === '1'
  const ext = '.' + (doc.currentVer.fileUrl.split('.').pop() || 'bin')
  const filename = `${doc.title}${ext}`
  const headers = new Headers({
    'Content-Type': doc.mimeType,
    'Content-Disposition': `${asInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`
  })
  const response = new NextResponse(stream as any, {
    status: 200,
    headers
  })
  return response
}


