import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  address: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
  phoneNumber: z.string().min(10, 'Nomor HP minimal 10 digit').optional(),
  bankAccountNumber: z.string().optional(),
  ewalletNumber: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama harus diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password harus diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
})

// GET - Mendapatkan profil user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update profil user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
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

    return NextResponse.json({
      message: 'Profil berhasil diperbarui',
      user: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

