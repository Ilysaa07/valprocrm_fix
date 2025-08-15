import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  address: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  nikKtp: z.string().min(16, 'NIK KTP minimal 16 digit').optional(),
  phoneNumber: z.string().min(10, 'Nomor HP minimal 10 digit').optional(),
  bankAccountNumber: z.string().optional(),
  ewalletNumber: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
})

// GET - Ambil data user berdasarkan ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        address: true,
        gender: true,
        nikKtp: true,
        phoneNumber: true,
        bankAccountNumber: true,
        ewalletNumber: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update data user oleh admin
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Cek apakah user ada
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userExists) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        fullName: true,
        address: true,
        gender: true,
        nikKtp: true,
        phoneNumber: true,
        bankAccountNumber: true,
        ewalletNumber: true,
        role: true,
        status: true,
        updatedAt: true,
      }
    })

    // Jika status diubah, tambahkan notifikasi
    if (validatedData.status && validatedData.status !== userExists.status) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Status Akun Diperbarui',
          message: `Status akun Anda telah diubah menjadi ${validatedData.status === 'APPROVED' ? 'DISETUJUI' : validatedData.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU'}`,
          isRead: false,
        }
      })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus user oleh admin
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: userId } = await params

    // Cek apakah user ada
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userExists) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hapus user
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}