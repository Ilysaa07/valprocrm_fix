import { NextRequest, NextResponse } from 'next/server'
import * as argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Jenis kelamin harus dipilih' }),
  nikKtp: z.string().length(16, 'NIK KTP harus 16 digit'),
  phoneNumber: z.string().min(10, 'Nomor HP minimal 10 digit'),
  bankAccountNumber: z.string().optional(),
  ewalletNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
}).refine((data) => data.bankAccountNumber || data.ewalletNumber, {
  message: "Harus mengisi nomor rekening bank atau e-wallet",
  path: ["bankAccountNumber"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
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
        status: 'PENDING'
      }
    })
    
    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })
    
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Registrasi Karyawan Baru',
          message: `${validatedData.fullName} telah mendaftar sebagai karyawan dan menunggu persetujuan.`
        }
      })
    }
    
    return NextResponse.json(
      { 
        message: 'Registrasi berhasil! Silakan tunggu persetujuan dari admin.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

