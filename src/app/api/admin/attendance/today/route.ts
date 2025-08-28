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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        checkInTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        checkInTime: 'asc'
      }
    })

    // Get all users to calculate absent employees
    const allUsers = await prisma.user.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    })

    // Calculate statistics
    const presentUserIds = attendanceRecords.map(record => record.userId)
    const absentUsers = allUsers.filter(user => !presentUserIds.includes(user.id))

    const stats = {
      totalUsers: allUsers.length,
      present: attendanceRecords.filter(record => record.status === 'PRESENT').length,
      absent: absentUsers.length,
      wfh: attendanceRecords.filter(record => record.status === 'WFH').length,
      sick: attendanceRecords.filter(record => record.status === 'SICK').length,
      leave: attendanceRecords.filter(record => record.status === 'LEAVE').length
    }

    const data = {
      stats,
      attendanceRecords: attendanceRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        userName: record.user.fullName,
        userEmail: record.user.email,
        status: record.status,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        location: record.location,
        notes: record.notes
      })),
      absentUsers: absentUsers.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }))
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Today attendance error:', error)
    return NextResponse.json({ error: 'Failed to fetch today attendance' }, { status: 500 })
  }
}
