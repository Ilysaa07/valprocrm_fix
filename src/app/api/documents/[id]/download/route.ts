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

  const fileRef = doc.currentVer.fileUrl || ''
  const isHttpUrl = /^https?:\/\//i.test(fileRef)

  if (isHttpUrl) {
    // If stored as remote URL, redirect for now (MVP behavior)
    return NextResponse.redirect(fileRef)
  }

  const isPublicUploads = fileRef.startsWith('/uploads/') || fileRef.startsWith('uploads/')
  const baseDir = isPublicUploads
    ? join(process.cwd(), 'public')
    : join(process.cwd(), 'storage', 'documents')
  const safeRef = fileRef.replace(/^\/+/, '')
  const filePath = join(baseDir, safeRef)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File missing' }, { status: 404 })
  }

  const stream = createReadStream(filePath)
  const { searchParams } = new URL(req.url)
  const asInline = searchParams.get('inline') === '1'
  const ext = '.' + (safeRef.split('.').pop() || 'bin')
  const filename = `${doc.title}${ext}`
  const headers = new Headers({
    'Content-Type': doc.mimeType,
    'Content-Disposition': `${asInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`,
    'X-Content-Type-Options': 'nosniff'
  })
  // Hint browser for images/pdf to preview smoothly in inline mode
  if (asInline) {
    headers.set('Cache-Control', 'private, max-age=60')
  }
  const response = new NextResponse(stream as any, {
    status: 200,
    headers
  })
  return response
}

// Lightweight probe to validate access and file existence before attempting to open a new tab
export async function HEAD(req: NextRequest, { params }: { params: { id: string } }) {
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

  const fileRef = doc.currentVer.fileUrl || ''
  const isHttpUrl = /^https?:\/\//i.test(fileRef)
  if (isHttpUrl) {
    return new NextResponse(null, { status: 200 })
  }

  const isPublicUploads = fileRef.startsWith('/uploads/') || fileRef.startsWith('uploads/')
  const baseDir = isPublicUploads
    ? join(process.cwd(), 'public')
    : join(process.cwd(), 'storage', 'documents')
  const safeRef = fileRef.replace(/^\/+/, '')
  const filePath = join(baseDir, safeRef)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File missing' }, { status: 404 })
  }

  return new NextResponse(null, { status: 200 })
}


