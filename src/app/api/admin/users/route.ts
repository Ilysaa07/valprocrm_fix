import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admin can access user list
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const whereClauses: any = {}
    
    if (search) {
      whereClauses.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role && role !== 'ALL') {
      whereClauses.role = role
    }
    
    if (status && status !== 'ALL') {
      whereClauses.status = status
    }

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClauses,
        select: {
          id: true,
          fullName: true,
          email: true,
          address: true,
          gender: true,
          nikKtp: true,
          phoneNumber: true,
          bankAccountNumber: true,
          ewalletNumber: true,
          profilePicture: true,
          role: true,
          status: true,
          createdAt: true
        },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClauses })
    ])

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

