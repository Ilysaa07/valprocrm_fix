import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Trigger reminders (manual or scheduled via cron hitting this endpoint)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Add other reminder logic here (tasks, events, etc.)
  
  return NextResponse.json({ message: 'Reminders diproses', count: 0 })
}


