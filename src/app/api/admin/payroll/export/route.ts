import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PayrollStatus } from '@prisma/client'

// GET /api/admin/payroll/export - Export payrolls
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'
    const period = searchParams.get('period')
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status') as PayrollStatus

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

    // If employee, only show their own payrolls
    if (session.user.role === 'EMPLOYEE') {
      where.employeeId = session.user.id
    }

    const payrolls = await prisma.payroll.findMany({
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
      orderBy: [
        { period: 'desc' },
        { employee: { fullName: 'asc' } }
      ]
    })

    if (format === 'excel') {
      return exportToExcel(payrolls)
    } else {
      return exportToPDF(payrolls)
    }
  } catch (error) {
    console.error('Error exporting payrolls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function exportToExcel(payrolls: any[]) {
  // Simple CSV export for now (can be enhanced with proper Excel library)
  const headers = [
    'Employee Name',
    'Email',
    'Period',
    'Basic Salary',
    'Total Allowances',
    'Total Deductions',
    'Gross Salary',
    'Net Salary',
    'Status',
    'Bank Account',
    'E-wallet',
    'Created At'
  ]

  const rows = payrolls.map(payroll => [
    payroll.employee.fullName,
    payroll.employee.email,
    payroll.period,
    payroll.basicSalary.toString(),
    payroll.totalAllowances.toString(),
    payroll.totalDeductions.toString(),
    payroll.grossSalary.toString(),
    payroll.netSalary.toString(),
    payroll.status,
    payroll.employee.bankAccountNumber || '',
    payroll.employee.ewalletNumber || '',
    payroll.createdAt.toISOString()
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="payrolls.csv"'
    }
  })
}

function exportToPDF(payrolls: any[]) {
  // For now, return JSON data that can be used by frontend to generate PDF
  // In production, you would use a PDF generation library like puppeteer or jsPDF
  return NextResponse.json({
    data: payrolls,
    format: 'pdf',
    message: 'Use frontend PDF generation'
  })
}
