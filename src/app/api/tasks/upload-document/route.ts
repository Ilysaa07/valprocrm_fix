import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const taskId = (data.get('taskId') as string) || ''

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId wajib disertakan' },
        { status: 400 }
      )
    }

    // Ensure task exists and user can upload
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 })
    }

    // Validasi tipe file - dokumen dan gambar
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Hanya PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, JPEG, PNG, WEBP, dan GIF yang diperbolehkan.' },
        { status: 400 }
      )
    }

    // Validasi ukuran file (maksimal 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 10MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `task_${session.user.id}_${uuidv4()}.${fileExtension}`
    
    // Use the same private storage strategy as main documents API
    const storageDir = join(process.cwd(), 'storage/documents')
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true })
    }

    const key = `task_${session.user.id}_${uuidv4()}.${fileExtension}`
    const absPath = join(storageDir, key)

    // Save file into private storage
    await writeFile(absPath, buffer)

    // Store key-only path; download API will resolve it
    const fileUrl = key

    // Create Document + Version and link to Task via TaskFile
    const document = await prisma.document.create({
      data: {
        title: file.name,
        description: `Lampiran tugas ${task.title}`,
        ownerId: session.user.id,
        visibility: 'PUBLIC',
        sizeBytes: file.size,
        mimeType: file.type,
        versions: {
          create: {
            version: 1,
            fileUrl: fileUrl,
            uploadedBy: session.user.id
          }
        }
      },
      include: { versions: true }
    })

    // set current version
    const createdVersion = document.versions[0]
    await prisma.document.update({
      where: { id: document.id },
      data: { currentVerId: createdVersion.id }
    })

    // Link to task
    await prisma.taskFile.create({
      data: {
        taskId: task.id,
        documentId: document.id,
        uploadedBy: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Dokumen berhasil diupload dan ditautkan ke tugas',
      file: {
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        documentId: document.id
      }
    })

  } catch (error) {
    console.error('Task document upload error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupload dokumen' },
      { status: 500 }
    )
  }
}

