import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/payroll/eligible-employees - Get employees eligible for payroll (have bank account or e-wallet)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100') // Default to 100 for better performance
    const skip = (page - 1) * limit

    const where: any = {
      role: 'EMPLOYEE',
      status: 'APPROVED',
      OR: [
        { bankAccountNumber: { not: null } },
        { ewalletNumber: { not: null } }
      ]
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          bankAccountNumber: true,
          ewalletNumber: true,
          phoneNumber: true
        },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({ 
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching eligible employees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
