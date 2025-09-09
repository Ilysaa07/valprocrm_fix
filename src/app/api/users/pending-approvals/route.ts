import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock data since we don't have a database connection
    // In production, this would query the actual users table for pending approvals
    const mockCount = Math.floor(Math.random() * 4) // Random count for demo
    
    return NextResponse.json({ count: mockCount })
  } catch (error) {
    console.error('Error fetching pending approvals count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
