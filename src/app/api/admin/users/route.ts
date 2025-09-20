import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as argon2 from 'argon2'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Jenis kelamin harus dipilih' }),
  nikKtp: z.string().length(16, 'NIK KTP harus 16 digit'),
  phoneNumber: z.string().min(10, 'Nomor HP minimal 10 digit'),
  bankAccountNumber: z.string().optional(),
  ewalletNumber: z.string().optional(),
}).refine((data) => data.bankAccountNumber || data.ewalletNumber, {
  message: "Minimal satu metode pembayaran harus diisi",
  path: ["bankAccountNumber"],
})

// GET /api/admin/users - Get all users with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (role) {
      where.role = role
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          bankAccountNumber: true,
          profilePicture: true,
          role: true,
          status: true,
          createdAt: true
        },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createUserSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { nikKtp: validatedData.nikKtp }
        ]
      }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email atau NIK KTP sudah terdaftar' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await argon2.hash(validatedData.password)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.fullName,
        address: validatedData.address,
        gender: validatedData.gender,
        nikKtp: validatedData.nikKtp,
        phoneNumber: validatedData.phoneNumber,
        bankAccountNumber: validatedData.bankAccountNumber,
        ewalletNumber: validatedData.ewalletNumber,
        role: 'EMPLOYEE',
        status: 'APPROVED' // Admin langsung approve
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        nikKtp: true,
        role: true,
        status: true,
        createdAt: true
      }
    })
    
    return NextResponse.json(
      { 
        message: 'Karyawan berhasil ditambahkan',
        user
      },
      { status: 201 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}