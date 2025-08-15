import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unread') === 'true'
    const skip = (page - 1) * limit

    const where: any = { userId: session.user.id }
    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          task: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ 
        where: { 
          userId: session.user.id, 
          isRead: false 
        } 
      })
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, notificationIds } = await request.json()

    if (action === 'mark_all_read') {
      await prisma.notification.updateMany({
        where: { 
          userId: session.user.id,
          isRead: false
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        message: 'Semua notifikasi telah ditandai sebagai dibaca'
      })
    }

    if (action === 'mark_read' && notificationIds) {
      await prisma.notification.updateMany({
        where: { 
          id: { in: notificationIds },
          userId: session.user.id
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        message: 'Notifikasi telah ditandai sebagai dibaca'
      })
    }

    return NextResponse.json(
      { error: 'Action tidak valid' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    let ids: string[] = []
    if (!all) {
      try {
        const body = await request.json()
        ids = Array.isArray(body?.notificationIds) ? body.notificationIds : []
      } catch {}
    }

    if (all) {
      await prisma.notification.deleteMany({ where: { userId: session.user.id } })
      return NextResponse.json({ message: 'Semua notifikasi dihapus' })
    }

    if (ids.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: ids }, userId: session.user.id } })
      return NextResponse.json({ message: 'Notifikasi terpilih dihapus' })
    }

    return NextResponse.json({ error: 'Tidak ada notifikasi untuk dihapus' }, { status: 400 })
  } catch (error) {
    console.error('Delete notifications error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

