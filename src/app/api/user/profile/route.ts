import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        profilePicture: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const mapped = {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      address: user.address,
      avatar: user.profilePicture,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
    return NextResponse.json({ data: mapped })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, phone, address, avatar } = body

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: name || undefined,
        phoneNumber: phone || undefined,
        address: address || undefined,
        profilePicture: avatar || undefined,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        profilePicture: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    const mapped = {
      id: updated.id,
      name: updated.fullName,
      email: updated.email,
      phone: updated.phoneNumber,
      address: updated.address,
      avatar: updated.profilePicture,
      role: updated.role,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }

    return NextResponse.json({ data: mapped })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
