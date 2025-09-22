import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '6months' // 6months, 1year, all

    // Calculate date range based on period - use same logic as transactions API
    let startDate: Date | undefined
    let endDate: Date | undefined
    
    // Always apply date filter for consistency with transactions API
    endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    
    switch (period) {
      case '1year':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'all':
        // For 'all', use a very early date to get all transactions
        startDate = new Date('2020-01-01')
        startDate.setHours(0, 0, 0, 0)
        break
      default: // 6months
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 6)
        startDate.setHours(0, 0, 0, 0)
    }
    
    // Get monthly data - always use date filter for consistency
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
    
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        type: true,
        amount: true,
        date: true,
        category: true
      },
      orderBy: { date: 'asc' }
    })

    // Group by month
    const monthlyData: { [key: string]: { income: number, expense: number, month: string } } = {}
    
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7) // YYYY-MM
      const monthName = new Date(transaction.date).toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          income: 0,
          expense: 0
        }
      }
      
      if (transaction.type === 'INCOME') {
        monthlyData[monthKey].income += Number(transaction.amount)
      } else if (transaction.type === 'EXPENSE') {
        monthlyData[monthKey].expense += Number(transaction.amount)
      }
    })

    // Convert to array and sort
    const chartData = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    )

    // Get category breakdown - use same where clause
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['type', 'category'],
      where: whereClause,
      _sum: {
        amount: true
      }
    })

    // Format category data
    const incomeCategories = categoryBreakdown
      .filter(item => item.type === 'INCOME')
      .map(item => ({
        category: item.category,
        amount: Number(item._sum.amount || 0),
        name: getCategoryName(item.category)
      }))

    const expenseCategories = categoryBreakdown
      .filter(item => item.type === 'EXPENSE')
      .map(item => ({
        category: item.category,
        amount: Number(item._sum.amount || 0),
        name: getCategoryName(item.category)
      }))

    // Calculate totals directly from transactions (most reliable)
    const incomeTransactions = transactions.filter(t => t.type === 'INCOME')
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE')
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const netIncome = totalIncome - totalExpense
    
    // Debug logging
    console.log(`Chart API Debug - Period: ${period}`)
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`)
    console.log(`Total transactions found: ${transactions.length}`)
    console.log(`Income transactions: ${incomeTransactions.length}, Total: ${totalIncome}`)
    console.log(`Expense transactions: ${expenseTransactions.length}, Total: ${totalExpense}`)
    console.log(`Chart data points: ${chartData.length}`)
    console.log(`Income categories: ${incomeCategories.length}`)
    console.log(`Expense categories: ${expenseCategories.length}`)
    
    // Log sample transactions for debugging
    if (transactions.length > 0) {
      console.log('Sample transactions:', transactions.slice(0, 3))
    }
    
    // Log expense categories for debugging
    if (expenseCategories.length > 0) {
      console.log('Expense categories:', expenseCategories)
    }

    return NextResponse.json({
      data: {
        chartData,
        incomeCategories,
        expenseCategories,
        totalIncome,
        totalExpense,
        netIncome,
        period
      }
    })

  } catch (error) {
    console.error('Get chart data error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

function getCategoryName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    // Income categories
    'ORDER_PAYMENT': 'Pembayaran Pesanan',
    'BONUS': 'Bonus',
    'COMMISSION': 'Komisi',
    'OTHER_INCOME': 'Pemasukan Lainnya',
    
    // Expense categories
    'PAYROLL_EXPENSE': 'Pembayaran Gaji',
    'OFFICE_SUPPLIES': 'Perlengkapan Kantor',
    'UTILITIES': 'Utilitas',
    'RENT': 'Sewa',
    'MARKETING': 'Marketing',
    'TRAVEL': 'Perjalanan',
    'MEALS': 'Makan',
    'EQUIPMENT': 'Peralatan',
    'SOFTWARE': 'Software',
    'TRAINING': 'Pelatihan',
    'OTHER_EXPENSE': 'Pengeluaran Lainnya'
  }
  
  return categoryNames[category] || category
}

