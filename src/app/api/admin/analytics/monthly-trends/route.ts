import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const monthlyTrends = []
    
    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
      
      // Get attendance data for this month
      const attendanceData = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
          checkInTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _count: { status: true }
      })

      // Get leave requests for this month
      const leaveData = await prisma.leaveRequest.groupBy({
        by: ['status'],
        where: {
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _count: { status: true }
      })

      // Calculate totals
      const present = attendanceData.find(a => a.status === 'PRESENT')?._count.status || 0
      const absent = attendanceData.find(a => a.status === 'ABSENT')?._count.status || 0
      const wfh = attendanceData.find(a => a.status === 'WFH')?._count.status || 0
      const leave = leaveData.find(l => l.status === 'APPROVED')?._count.status || 0

      monthlyTrends.push({
        month: startOfMonth.toLocaleDateString('id-ID', { month: 'short' }),
        present,
        absent,
        wfh,
        leave
      })
    }

    return NextResponse.json({
      data: monthlyTrends
    })

  } catch (error) {
    console.error('Error fetching monthly trends:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
