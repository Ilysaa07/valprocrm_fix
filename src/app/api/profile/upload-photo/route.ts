import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    // Validasi tipe file - hanya gambar
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Hanya JPG, JPEG, PNG, dan WEBP yang diperbolehkan.' },
        { status: 400 }
      )
    }

    // Validasi ukuran file (maksimal 5MB untuk foto profil)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `profile_${session.user.id}_${uuidv4()}.${fileExtension}`
    
    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public/uploads/profiles')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    const uploadPath = join(uploadDir, uniqueFilename)

    // Save file
    await writeFile(uploadPath, buffer)

    // Update user profile picture in database
    const fileUrl = `/uploads/profiles/${uniqueFilename}`
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: fileUrl },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    })

    return NextResponse.json({
      message: 'Foto profil berhasil diupload',
      user: updatedUser,
      profilePicture: fileUrl
    })

  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupload foto profil' },
      { status: 500 }
    )
  }
}

