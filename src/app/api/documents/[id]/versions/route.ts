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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canEdit = session.user.role === 'ADMIN' || doc.ownerId === session.user.id
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file') as unknown as File | null
  if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'File too large. Max 20MB' }, { status: 400 })

  const storageDir = join(process.cwd(), 'storage', 'documents')
  if (!existsSync(storageDir)) await mkdir(storageDir, { recursive: true })
  const extension = (file.name.split('.').pop() || '').toLowerCase()
  const key = `${uuidv4()}.${extension}`
  const absPath = join(storageDir, key)
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(absPath, bytes)

  const created = await prisma.$transaction(async (tx) => {
    const last = await tx.documentVersion.findFirst({
      where: { documentId: params.id },
      orderBy: { version: 'desc' }
    })
    const nextVersion = (last?.version || 0) + 1
    const ver = await tx.documentVersion.create({
      data: {
        documentId: params.id,
        version: nextVersion,
        fileUrl: key,
        uploadedBy: session.user.id,
      }
    })
    const updated = await tx.document.update({ where: { id: params.id }, data: { currentVerId: ver.id } })
    return { ver, updated }
  })

  return NextResponse.json({ message: 'Version uploaded', data: created })
}


