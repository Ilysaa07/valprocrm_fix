import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test database connection and count contacts
    const contactCount = await prisma.contact.count()
    const contacts = await prisma.contact.findMany({
      take: 5,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      message: 'Database connection successful',
      totalContacts: contactCount,
      recentContacts: contacts,
      currentUser: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
