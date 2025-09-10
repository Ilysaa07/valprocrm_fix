import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PayrollStatus } from '@prisma/client'

// GET /api/employee/payroll - Get employee's own payrolls
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period')
    const status = searchParams.get('status') as PayrollStatus

    const skip = (page - 1) * limit

    const where: any = {
      employeeId: session.user.id
    }
    
    if (period) {
      where.period = period
    }
    
    if (status) {
      where.status = status
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              bankAccountNumber: true,
              ewalletNumber: true,
              phoneNumber: true,
              address: true,
              nikKtp: true
            }
          },
          components: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payroll.count({ where })
    ])

    return NextResponse.json({
      data: payrolls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching employee payrolls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
