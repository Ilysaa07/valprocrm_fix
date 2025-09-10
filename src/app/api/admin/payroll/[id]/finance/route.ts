import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PayrollFinanceIntegration } from '@/lib/payroll-finance-integration'

// GET /api/admin/payroll/[id]/finance - Get finance transaction related to payroll
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const transaction = await PayrollFinanceIntegration.getPayrollTransaction(id)
    
    if (!transaction) {
      return NextResponse.json({ 
        error: 'No finance transaction found for this payroll' 
      }, { status: 404 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Error fetching payroll finance transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

