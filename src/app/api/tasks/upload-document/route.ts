import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { existsSync } from 'fs'

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

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
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
    
    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public/uploads/tasks')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    const uploadPath = join(uploadDir, uniqueFilename)

    // Save file
    await writeFile(uploadPath, buffer)

    // Return file info
    const fileUrl = `/uploads/tasks/${uniqueFilename}`
    
    return NextResponse.json({
      message: 'Dokumen berhasil diupload',
      file: {
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type
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

