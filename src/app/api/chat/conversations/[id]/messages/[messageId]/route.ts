import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: conversationId, messageId } = await params
    const { scope } = await req.json().catch(() => ({ scope: 'me' })) as { scope?: 'me' | 'all' }

    // Verify membership
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
      select: { role: true },
    })
    if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const message = await prisma.message.findUnique({ where: { id: messageId }, select: { id: true, senderId: true, conversationId: true } })
    if (!message || message.conversationId !== conversationId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const io = (global as any).io

    if (scope === 'all') {
      // Only sender or admin/moderator can delete for everyone
      const canDeleteForAll = message.senderId === session.user.id || participant.role === 'ADMIN' || participant.role === 'MODERATOR'
      if (!canDeleteForAll) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, messageType: 'DELETED', content: '', deletedAt: new Date(), deletedBy: session.user.id },
      })

      try {
        if (io) io.to(`conversation:${conversationId}`).emit('message_deleted', { messageId, conversationId, deletedBy: session.user.id })
      } catch {}

      return NextResponse.json({ ok: true })
    }

    // scope === 'me' (default): hide message for current user
    await prisma.messageDelete.create({
      data: { messageId, userId: session.user.id },
    }).catch(() => null)

    try {
      if (io) io.to(`user:${session.user.id}`).emit('message_deleted_for_me', { messageId, conversationId })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}


