import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.enum([
    'ORDER_PAYMENT', 'BONUS', 'COMMISSION', 'OTHER_INCOME',
    'OFFICE_SUPPLIES', 'UTILITIES', 'RENT', 'MARKETING', 
    'TRAVEL', 'MEALS', 'EQUIPMENT', 'SOFTWARE', 'TRAINING', 'PAYROLL_EXPENSE', 'OTHER_EXPENSE'
  ]).optional(),
  amount: z.number().positive('Jumlah harus lebih dari 0').optional(),
  description: z.string().min(1, 'Deskripsi harus diisi').optional(),
  date: z.union([z.string().datetime('Format tanggal tidak valid'), z.date()]).optional(),
})

// GET - Mendapatkan detail transaksi
export async function GET(
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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })

  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update transaksi
export async function PUT(
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
    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.category) updateData.category = validatedData.category
    if (validatedData.amount) updateData.amount = validatedData.amount
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.date) updateData.date = new Date(validatedData.date as any)

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    // Removed audit log on update

    return NextResponse.json({
      message: 'Transaksi berhasil diperbarui',
      transaction
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update transaction error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus transaksi
export async function DELETE(
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

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.transaction.delete({
      where: { id }
    })

    // Removed audit log on delete

    return NextResponse.json({
      message: 'Transaksi berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

