import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum([
    'SALARY', 'BONUS', 'COMMISSION', 'OTHER_INCOME',
    'OFFICE_SUPPLIES', 'UTILITIES', 'RENT', 'MARKETING', 
    'TRAVEL', 'MEALS', 'EQUIPMENT', 'SOFTWARE', 'TRAINING', 'PAYROLL_EXPENSE', 'OTHER_EXPENSE'
  ]),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  date: z.string().datetime('Format tanggal tidak valid'),
})

// GET - Mendapatkan daftar transaksi
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Prisma.TransactionWhereInput = {}

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    // Calculate summary
    const summary = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true
      }
    })

    const totalIncome = summary.find(s => s.type === 'INCOME')?._sum.amount || 0
    const totalExpense = summary.find(s => s.type === 'EXPENSE')?._sum.amount || 0
    const netIncome = Number(totalIncome) - Number(totalExpense)

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalIncome: Number(totalIncome),
        totalExpense: Number(totalExpense),
        netIncome
      }
    })

  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Membuat transaksi baru
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    const transaction = await prisma.transaction.create({
      data: {
        type: validatedData.type,
        category: validatedData.category,
        amount: validatedData.amount,
        description: validatedData.description,
        date: new Date(validatedData.date),
        createdById: session.user.id
      },
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

    // Removed audit logs and budget checks

    return NextResponse.json({
      message: 'Transaksi berhasil dibuat',
      transaction
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

