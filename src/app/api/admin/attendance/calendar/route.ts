import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  month: z.string().regex(/^\d{1,2}$/).transform(Number),
  year: z.string().regex(/^\d{4}$/).transform(Number),
})

// GET /api/admin/attendance/calendar - get attendance calendar for all employees (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month dan year harus disediakan' }, { status: 400 })
    }

    const input = querySchema.parse({ month, year })

    // Get start and end of month
    const startDate = new Date(input.year, input.month - 1, 1)
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999)

    // Get all employees
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    })

    // Get attendance for the month
    const attendance = await prisma.attendance.findMany({
      where: {
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      },
      orderBy: { checkInTime: 'asc' }
    })

    // Get leave requests for the month
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      }
    })

    // Get WFH logs for the month
    const wfhLogs = await prisma.wfhLog.findMany({
      where: {
        logTime: {
          gte: startDate,
          lte: endDate
        },
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true
          }
        }
      }
    })

    // Create calendar data structure
    const calendarData = employees.map(employee => {
      const employeeAttendance = attendance.filter(a => a.userId === employee.id)
      const employeeLeaves = leaveRequests.filter(l => l.userId === employee.id)
      const employeeWFH = wfhLogs.filter(w => w.userId === employee.id)

      // Create daily status for the month
      const days = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const day = currentDate.getDate()
        const dayAttendance = employeeAttendance.find(a => {
          const checkInDate = new Date(a.checkInTime!)
          return checkInDate.getDate() === day && 
                 checkInDate.getMonth() === currentDate.getMonth() && 
                 checkInDate.getFullYear() === currentDate.getFullYear()
        })
        
        const dayLeave = employeeLeaves.find(l => {
          const leaveStart = new Date(l.startDate)
          const leaveEnd = new Date(l.endDate)
          return currentDate >= leaveStart && currentDate <= leaveEnd
        })
        
        const dayWFH = employeeWFH.find(w => {
          const wfhDate = new Date(w.logTime)
          return wfhDate.getDate() === day && 
                 wfhDate.getMonth() === currentDate.getMonth() && 
                 wfhDate.getFullYear() === currentDate.getFullYear()
        })

        let status = 'ABSENT'
        let notes = null
        let type = null

        if (dayAttendance) {
          status = dayAttendance.status
          notes = dayAttendance.notes
        } else if (dayLeave) {
          status = 'LEAVE'
          notes = dayLeave.reason
          type = dayLeave.type
        } else if (dayWFH) {
          status = 'WFH'
          notes = dayWFH.activityDescription
        }

        days.push({
          day,
          status,
          notes,
          type,
          checkInTime: dayAttendance?.checkInTime || null,
          checkOutTime: dayAttendance?.checkOutTime || null
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }

      return {
        employeeId: employee.id,
        employeeName: employee.fullName,
        employeeEmail: employee.email,
        employeeAvatar: employee.profilePicture,
        days
      }
    })

    return NextResponse.json({ 
      data: calendarData,
      month: input.month,
      year: input.year,
      totalEmployees: employees.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Get admin calendar error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
