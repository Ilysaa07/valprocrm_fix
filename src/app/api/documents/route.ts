import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_SIZE_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/jpg'
]

function isAdmin(role: string | undefined | null) {
  return role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const visibility = searchParams.get('visibility') // PUBLIC | PRIVATE | ALL
  const folderId = searchParams.get('folderId') || undefined
  const tag = searchParams.get('tag') || undefined
  const mine = searchParams.get('mine') === 'true'
  const shared = searchParams.get('shared') === 'true'

  const whereClauses: any = {
    isArchived: false,
  }

  if (folderId) whereClauses.folderId = folderId
  if (tag) whereClauses.tags = { some: { name: tag } }

  // Access control for listing
  if (isAdmin(session.user.role)) {
    // Admin can see all, apply optional visibility filter
    if (visibility === 'PUBLIC') whereClauses.visibility = 'PUBLIC'
    if (visibility === 'PRIVATE') whereClauses.visibility = 'PRIVATE'
  } else {
    // Employee: compose OR of accessible documents
    const accessOr: any[] = [
      { visibility: 'PUBLIC' },
      { ownerId: session.user.id },
      { acls: { some: { userId: session.user.id, canView: true } } },
      { acls: { some: { role: session.user.role, canView: true } } },
    ]
    if (mine) {
      whereClauses.ownerId = session.user.id
    } else if (shared) {
      whereClauses.AND = [{ ownerId: { not: session.user.id } }]
      whereClauses.OR = [
        { acls: { some: { userId: session.user.id, canView: true } } },
        { acls: { some: { role: session.user.role, canView: true } } },
      ]
    } else if (visibility === 'PUBLIC') {
      whereClauses.visibility = 'PUBLIC'
    } else {
      whereClauses.OR = accessOr
    }
  }

  const documents = await prisma.document.findMany({
    where: whereClauses,
    include: {
      currentVer: true,
      tags: true,
      folder: true,
      owner: { select: { id: true, fullName: true, email: true } },
      _count: { select: { downloadLogs: true, versions: true } },
    },
    orderBy: { updatedAt: 'desc' }
  })

  return NextResponse.json({ data: documents })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as unknown as File | null
  const title = (form.get('title') as string | null)?.trim()
  const description = (form.get('description') as string | null)?.trim() || undefined
  const folderId = (form.get('folderId') as string | null) || undefined
  const visibility = ((form.get('visibility') as string | null) || 'PRIVATE').toUpperCase()
  const tagsRaw = (form.get('tags') as string | null) || ''
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 20MB' }, { status: 400 })
  }

  // Validate owner user exists
  const owner = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!owner) {
    return NextResponse.json({ error: 'User tidak ditemukan untuk sesi saat ini' }, { status: 401 })
  }

  // Validate folder if provided
  if (folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder) {
      return NextResponse.json({ error: 'Folder tidak ditemukan' }, { status: 400 })
    }
  }

  // Store file in private storage
  const storageDir = join(process.cwd(), 'storage', 'documents')
  if (!existsSync(storageDir)) {
    await mkdir(storageDir, { recursive: true })
  }

  const extension = (file.name.split('.').pop() || '').toLowerCase()
  const key = `${uuidv4()}.${extension}`
  const absPath = join(storageDir, key)
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(absPath, bytes)

  // Create DB entries
  try {
    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          title,
          description,
          folderId,
          ownerId: owner.id,
          visibility: visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
          sizeBytes: file.size,
          mimeType: file.type,
        }
      })

      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          fileUrl: key,
          uploadedBy: owner.id,
        }
      })

      const updated = await tx.document.update({
        where: { id: doc.id },
        data: { currentVerId: version.id },
        include: { currentVer: true }
      })

      if (tags.length > 0) {
        await tx.documentTag.createMany({
          data: tags.map((name) => ({ name, documentId: doc.id }))
        })
      }

      return updated
    })

    // Emit socket notification for admins about new document (optional)
    try {
      const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.()
      if (io) io.emit('notification', { title: 'Dokumen Baru', message: `Dokumen "${created.title}" diunggah` })
    } catch {}

    return NextResponse.json({ message: 'Uploaded', data: created })
  } catch (e: any) {
    if (e?.code === 'P2003') {
      return NextResponse.json({ error: 'Relasi tidak valid (owner atau folder). Pastikan akun dan folder tersedia.' }, { status: 400 })
    }
    console.error('Upload document error:', e)
    return NextResponse.json({ error: 'Gagal menyimpan dokumen' }, { status: 500 })
  }
}


