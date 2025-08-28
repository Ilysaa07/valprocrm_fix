import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role?: string | null) { return role === 'ADMIN' }

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin(session.user.role) && doc.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const acls = await prisma.documentAcl.findMany({ where: { documentId: params.id }, include: { user: { select: { id: true, fullName: true, email: true } } } })
  return NextResponse.json({ data: acls })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin(session.user.role) && doc.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, role, canView = true, canEdit = false } = body || {}
  if (!userId && !role) return NextResponse.json({ error: 'userId or role is required' }, { status: 400 })

  const created = await prisma.documentAcl.create({ data: { documentId: params.id, userId, role, canView: !!canView, canEdit: !!canEdit } })
  return NextResponse.json({ data: created })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin(session.user.role) && doc.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { aclId, canView, canEdit } = body || {}
  if (!aclId) return NextResponse.json({ error: 'aclId required' }, { status: 400 })
  const updated = await prisma.documentAcl.update({ where: { id: aclId }, data: { canView, canEdit } })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin(session.user.role) && doc.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const aclId = searchParams.get('aclId')
  if (!aclId) return NextResponse.json({ error: 'aclId required' }, { status: 400 })
  await prisma.documentAcl.delete({ where: { id: aclId } })
  return NextResponse.json({ success: true })
}


