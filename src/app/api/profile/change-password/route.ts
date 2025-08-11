import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama harus diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password harus diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
})

// POST - Mengganti password
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await argon2.verify(
      user.password,
      validatedData.currentPassword
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Password lama tidak benar' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await argon2.hash(validatedData.newPassword)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword }
    })

    return NextResponse.json({
      message: 'Password berhasil diubah'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

