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

    // Calculate date range based on period
    let startDate: Date
    const endDate = new Date()
    
    switch (period) {
      case '1year':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2020-01-01') // Far back date
        break
      default: // 6months
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 6)
    }

    // Get monthly data
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
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
      } else {
        monthlyData[monthKey].expense += Number(transaction.amount)
      }
    })

    // Convert to array and sort
    const chartData = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    )

    // Get category breakdown
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['type', 'category'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
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

    // Calculate totals
    const totalIncome = incomeCategories.reduce((sum, cat) => sum + cat.amount, 0)
    const totalExpense = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0)
    const netIncome = totalIncome - totalExpense

    return NextResponse.json({
      chartData,
      incomeCategories,
      expenseCategories,
      summary: {
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
    'SALARY': 'Gaji',
    'BONUS': 'Bonus',
    'COMMISSION': 'Komisi',
    'OTHER_INCOME': 'Pemasukan Lain',
    
    // Expense categories
    'OFFICE_SUPPLIES': 'Perlengkapan Kantor',
    'UTILITIES': 'Utilitas',
    'RENT': 'Sewa',
    'MARKETING': 'Marketing',
    'TRAVEL': 'Perjalanan',
    'MEALS': 'Makan',
    'EQUIPMENT': 'Peralatan',
    'SOFTWARE': 'Software',
    'TRAINING': 'Pelatihan',
    'OTHER_EXPENSE': 'Pengeluaran Lain'
  }
  
  return categoryNames[category] || category
}

