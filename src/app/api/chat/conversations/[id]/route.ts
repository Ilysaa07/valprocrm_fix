import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE conversation for current user (soft delete for user)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    // Ensure user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
      select: { id: true },
    })
    if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Mark deleted for this user
    await prisma.conversationDelete.create({
      data: { conversationId: id, userId: session.user.id },
    }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }
}


