import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PayrollStatus } from '@prisma/client'
import { PayrollFinanceIntegration } from '@/lib/payroll-finance-integration'

// GET /api/admin/payroll/[id] - Get specific payroll
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const payroll = await prisma.payroll.findUnique({
      where: { id },
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
        createdBy: {
          select: {
            id: true,
            fullName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true
          }
        },
        components: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // Check if user can access this payroll
    if (session.user.role === 'EMPLOYEE' && payroll.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: payroll })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/payroll/[id] - Update payroll
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      basicSalary,
      components,
      status,
      notes
    } = body

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
      include: { components: true }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // If status is being changed to PAID, set paidAt
    const updateData: any = {
      updatedById: session.user.id
    }

    if (basicSalary !== undefined) {
      updateData.basicSalary = Number(basicSalary)
    }

    if (status !== undefined) {
      updateData.status = status
      if (status === 'PAID') {
        updateData.paidAt = new Date()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Recalculate totals if components are provided
    if (components) {
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
      const grossSalary = (basicSalary || existingPayroll.basicSalary) + totalAllowances
      const netSalary = grossSalary - totalDeductions

      updateData.totalAllowances = totalAllowances
      updateData.totalDeductions = totalDeductions
      updateData.grossSalary = grossSalary
      updateData.netSalary = netSalary
    }

    // Update payroll
    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
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

    // Update components if provided
    if (components) {
      // Delete existing components
      await prisma.payrollComponent.deleteMany({
        where: { payrollId: id }
      })

      // Create new components
      await prisma.payrollComponent.createMany({
        data: components.map((component: any, index: number) => ({
          payrollId: id,
          name: component.name,
          type: component.type,
          amount: Number(component.amount),
          isTaxable: component.isTaxable ?? true,
          description: component.description,
          order: index
        }))
      })
    }

    // Integrasi dengan Finance - Update transaksi keuangan jika ada perubahan
    let financeIntegrationResult = null
    if (components || basicSalary !== undefined) {
      try {
        // Tentukan metode pembayaran
        let paymentMethod: 'BANK' | 'EWALLET' | 'BOTH' = 'BANK'
        if (payroll.employee.bankAccountNumber && payroll.employee.ewalletNumber) {
          paymentMethod = 'BOTH'
        } else if (payroll.employee.ewalletNumber && !payroll.employee.bankAccountNumber) {
          paymentMethod = 'EWALLET'
        }

        const updateData = {
          employeeName: payroll.employee.fullName,
          period: payroll.period,
          netSalary: Number(payroll.netSalary),
          paymentMethod,
          bankAccount: payroll.employee.bankAccountNumber,
          ewalletNumber: payroll.employee.ewalletNumber
        }

        financeIntegrationResult = await PayrollFinanceIntegration.updatePayrollTransaction(id, updateData)
        
        if (!financeIntegrationResult.success) {
          console.warn('Finance integration update failed:', financeIntegrationResult.error)
        }
      } catch (integrationError) {
        console.error('Finance integration update error:', integrationError)
      }
    }

    return NextResponse.json({ 
      data: payroll,
      financeIntegration: financeIntegrationResult
    })
  } catch (error) {
    console.error('Error updating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/payroll/[id] - Delete payroll
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // Only allow deletion of DRAFT payrolls
    if (existingPayroll.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft payrolls can be deleted' }, { status: 400 })
    }

    // Integrasi dengan Finance - Hapus transaksi keuangan terkait
    let financeIntegrationResult = null
    try {
      financeIntegrationResult = await PayrollFinanceIntegration.deletePayrollTransaction(id)
      
      if (!financeIntegrationResult.success) {
        console.warn('Finance integration delete failed:', financeIntegrationResult.error)
        // Tetap lanjutkan penghapusan payroll meskipun finance integration gagal
      }
    } catch (integrationError) {
      console.error('Finance integration delete error:', integrationError)
      // Tetap lanjutkan penghapusan payroll meskipun finance integration gagal
    }

    // Delete payroll (components will be deleted automatically due to cascade)
    await prisma.payroll.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Payroll deleted successfully',
      financeIntegration: financeIntegrationResult
    })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
