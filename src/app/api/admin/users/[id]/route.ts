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

// GET - Mendapatkan detail user berdasarkan ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = params.id

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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = params.id
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

    return NextResponse.json({
      message: 'Data user berhasil diperbarui',
      user: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Menghapus user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = params.id

    // Cek apakah user ada
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: true,
        createdTasks: true,
        issuedInvoices: true,
        createdInvoices: true
      }
    })

    if (!userExists) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek apakah user memiliki task yang aktif
    if (userExists.assignedTasks.some(task => task.status === 'NOT_STARTED' || task.status === 'IN_PROGRESS')) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus user yang memiliki tugas aktif' },
        { status: 400 }
      )
    }

    // Cek apakah user memiliki invoice
    if (userExists.issuedInvoices.length > 0 || userExists.createdInvoices.length > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus user yang memiliki invoice. Hapus invoice terlebih dahulu.' },
        { status: 400 }
      )
    }

    // Hapus semua data terkait user
    // Hapus notifikasi user terlebih dahulu
    await prisma.notification.deleteMany({
      where: { userId }
    })

    // Hapus task submission
    await prisma.taskSubmission.deleteMany({
      where: { userId }
    })

    // Hapus transaksi
    await prisma.transaction.deleteMany({
      where: { createdById: userId }
    })

    // Hapus user
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: 'User berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}