import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PayrollStatus, PayrollComponentType } from '@prisma/client'
import { PayrollFinanceIntegration } from '@/lib/payroll-finance-integration'


// GET /api/admin/payroll - Get all payrolls with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period')
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status') as PayrollStatus
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (period) {
      where.period = period
    }
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.employee = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
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
              phoneNumber: true
            }
          },
          createdBy: {
            select: {
              id: true,
              fullName: true
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
    console.error('Error fetching payrolls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/payroll - Create new payroll
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      employeeId,
      period,
      basicSalary,
      components,
      notes
    } = body

    // Validate required fields
    if (!employeeId || !period || !basicSalary || !components) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if payroll already exists for this employee and period
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employeeId_period: {
          employeeId,
          period
        }
      }
    })

    if (existingPayroll) {
      return NextResponse.json({ error: 'Payroll already exists for this employee and period' }, { status: 400 })
    }

    // Validate employee exists and has bank account or e-wallet
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        bankAccountNumber: true,
        ewalletNumber: true,
        role: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (employee.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'User is not an employee' }, { status: 400 })
    }

    // Check if employee has either bank account or e-wallet
    if (!employee.bankAccountNumber && !employee.ewalletNumber) {
      return NextResponse.json({ 
        error: 'Employee must have either bank account number or e-wallet number to create payroll' 
      }, { status: 400 })
    }

    // Calculate totals
    const allowances = components.filter((c: any) => 
      c.type !== 'INCOME_TAX' && 
      c.type !== 'SOCIAL_SECURITY' && 
      c.type !== 'HEALTH_INSURANCE' && 
      c.type !== 'PENSION_FUND' && 
      c.type !== 'LOAN_DEDUCTION' && 
      c.type !== 'LATE_PENALTY' && 
      c.type !== 'ABSENCE_DEDUCTION' && 
      c.type !== 'OTHER_DEDUCTION'
    )

    const deductions = components.filter((c: any) => 
      c.type === 'INCOME_TAX' || 
      c.type === 'SOCIAL_SECURITY' || 
      c.type === 'HEALTH_INSURANCE' || 
      c.type === 'PENSION_FUND' || 
      c.type === 'LOAN_DEDUCTION' || 
      c.type === 'LATE_PENALTY' || 
      c.type === 'ABSENCE_DEDUCTION' || 
      c.type === 'OTHER_DEDUCTION'
    )

    const totalAllowances = allowances.reduce((sum: number, c: any) => sum + Number(c.amount), 0)
    const totalDeductions = deductions.reduce((sum: number, c: any) => sum + Number(c.amount), 0)
    const grossSalary = Number(basicSalary) + totalAllowances
    const netSalary = grossSalary - totalDeductions

    // Create payroll with components
    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        period,
        basicSalary: Number(basicSalary),
        totalAllowances,
        totalDeductions,
        grossSalary,
        netSalary,
        notes,
        createdById: session.user.id,
        components: {
          create: components.map((component: any, index: number) => ({
            name: component.name,
            type: component.type,
            amount: Number(component.amount),
            isTaxable: component.isTaxable ?? true,
            description: component.description,
            order: index
          }))
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            bankAccountNumber: true,
            ewalletNumber: true,
            phoneNumber: true
          }
        },
        components: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Integrasi dengan Finance - Buat transaksi keuangan otomatis
    let financeIntegrationResult = null
    try {
      // Tentukan metode pembayaran
      let paymentMethod: 'BANK' | 'EWALLET' | 'BOTH' = 'BANK'
      if (employee.bankAccountNumber && employee.ewalletNumber) {
        paymentMethod = 'BOTH'
      } else if (employee.ewalletNumber && !employee.bankAccountNumber) {
        paymentMethod = 'EWALLET'
      }

      const payrollFinanceData = {
        payrollId: payroll.id,
        employeeName: employee.fullName,
        period: payroll.period,
        netSalary: Number(payroll.netSalary),
        paymentMethod,
        bankAccount: employee.bankAccountNumber,
        ewalletNumber: employee.ewalletNumber,
        createdById: session.user.id
      }

      financeIntegrationResult = await PayrollFinanceIntegration.createPayrollTransaction(payrollFinanceData)
      
      if (!financeIntegrationResult.success) {
        console.warn('Finance integration failed:', financeIntegrationResult.error)
        // Tidak mengembalikan error karena payroll sudah berhasil dibuat
        // Hanya log warning untuk monitoring
      }
    } catch (integrationError) {
      console.error('Finance integration error:', integrationError)
      // Tidak mengembalikan error karena payroll sudah berhasil dibuat
    }

    return NextResponse.json({ 
      data: payroll,
      financeIntegration: financeIntegrationResult
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
