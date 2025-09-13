import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_ATTEMPTS = 5

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = (searchParams.get('email') || '').toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const throttle = await prisma.loginThrottle.findFirst({
      where: { email },
      orderBy: { lastAttempt: 'desc' }
    })

    const failedCount = throttle?.failedCount || 0
    const lockedUntil = throttle?.lockedUntil || null
    const now = new Date()
    const isLocked = !!lockedUntil && lockedUntil > now
    const remaining = Math.max(0, MAX_ATTEMPTS - failedCount)

    return NextResponse.json({ failedCount, remaining, isLocked, lockedUntil })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}


