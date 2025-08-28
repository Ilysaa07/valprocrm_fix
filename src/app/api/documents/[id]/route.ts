import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

function canView(userId: string, role: string | null | undefined, doc: any) {
  if (isAdmin(role)) return true
  if (doc.visibility === 'PUBLIC') return true
  if (doc.ownerId === userId) return true
  if (doc.acls?.some((a: any) => a.userId === userId && a.canView)) return true
  if (doc.acls?.some((a: any) => a.role === role && a.canView)) return true
  return false
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: { currentVer: true, versions: true, tags: true, acls: true, owner: { select: { id: true, fullName: true } } }
  })

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canView(session.user.id, session.user.role, doc)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ data: doc })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, visibility, isArchived } = body || {}

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canEdit = isAdmin(session.user.role) || doc.ownerId === session.user.id
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: {
      title: title ?? undefined,
      description: description ?? undefined,
      visibility: visibility === 'PUBLIC' ? 'PUBLIC' : visibility === 'PRIVATE' ? 'PRIVATE' : undefined,
      isArchived: typeof isArchived === 'boolean' ? isArchived : undefined,
    },
    include: { currentVer: true }
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canEdit = isAdmin(session.user.role) || doc.ownerId === session.user.id
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const archived = await prisma.document.update({ where: { id: params.id }, data: { isArchived: true } })
  return NextResponse.json({ data: archived })
}


