import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_ATTEMPTS = 10 // Increased from 5 to 10

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = (searchParams.get('email') || '').toLowerCase().trim()
    
    if (!email) {
      return NextResponse.json({ 
        failedCount: 0, 
        remaining: MAX_ATTEMPTS, 
        isLocked: false, 
        lockedUntil: null 
      })
    }

    // Add timeout to prevent hanging
    const throttle = await Promise.race([
      prisma.loginThrottle.findFirst({
        where: { email },
        orderBy: { lastAttempt: 'desc' }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]) as any

    const failedCount = throttle?.failedCount || 0
    const lockedUntil = throttle?.lockedUntil || null
    const now = new Date()
    const isLocked = !!lockedUntil && lockedUntil > now
    const remaining = Math.max(0, MAX_ATTEMPTS - failedCount)

    return NextResponse.json({ 
      failedCount, 
      remaining, 
      isLocked, 
      lockedUntil: lockedUntil?.toISOString() || null 
    })
  } catch (error) {
    console.error('Throttle check error:', error)
    // Return safe defaults instead of error
    return NextResponse.json({ 
      failedCount: 0, 
      remaining: MAX_ATTEMPTS, 
      isLocked: false, 
      lockedUntil: null 
    })
  }
}


