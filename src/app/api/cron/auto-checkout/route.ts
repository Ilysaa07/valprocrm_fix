import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint should be invoked by a scheduler at 16:00 local time
export async function POST() {
	try {
		const now = new Date()
		const todayStart = new Date(); todayStart.setHours(0,0,0,0)
		const cutoff = new Date(); cutoff.setHours(16,0,0,0)

		if (now.getTime() < cutoff.getTime()) {
			return NextResponse.json({ message: 'Not time yet' })
		}

		const openAttendances = await prisma.attendance.findMany({
			where: {
				checkInTime: { gte: todayStart },
				checkOutTime: null,
			}
		})

		const results: string[] = []
		for (const a of openAttendances) {
			await prisma.attendance.update({
				where: { id: a.id },
				data: {
					checkOutTime: cutoff,
					notes: a.notes ? `${a.notes} (Auto check-out 16:00)` : 'Auto check-out 16:00'
				}
			})
			results.push(a.id)
		}

		return NextResponse.json({ message: 'Auto check-out completed', count: results.length, ids: results })
	} catch (e) {
		return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
	}
}
