import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action } = await request.json()
    
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Action tidak valid' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (user.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'User sudah diproses sebelumnya' },
        { status: 400 }
      )
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: action }
    })

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: id,
        title: action === 'APPROVED' ? 'Registrasi Disetujui' : 'Registrasi Ditolak',
        message: action === 'APPROVED' 
          ? 'Selamat! Registrasi Anda telah disetujui. Anda sekarang dapat menggunakan sistem.'
          : 'Maaf, registrasi Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.'
      }
    })

    return NextResponse.json({
      message: `User berhasil ${action === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        status: updatedUser.status
      }
    })

  } catch (error) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

