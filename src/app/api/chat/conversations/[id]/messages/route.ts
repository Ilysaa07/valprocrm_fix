import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().default(''),
  messageType: z.enum(['TEXT', 'FILE', 'IMAGE', 'VIDEO']).optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileSize: z.number(),
    fileType: z.string(),
  })).optional(),
}).refine((data) => {
  const hasText = typeof data.content === 'string' && data.content.trim().length > 0
  const hasAttachments = Array.isArray(data.attachments) && data.attachments.length > 0
  return hasText || hasAttachments
}, { message: 'Message must contain text or attachments' })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Find message IDs deleted for this user (raw to avoid client model mismatch)
    const deletedMessagesRaw = await prisma.$queryRaw<Array<{ messageId: string }>>`
      SELECT messageId FROM message_deletes WHERE userId = ${session.user.id}
    `;
    const deletedMessageIds = deletedMessagesRaw.map((m) => m.messageId);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        id: { notIn: deletedMessageIds },
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
          },
        },
        attachments: true,
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const totalMessages = await prisma.message.count({
      where: {
        conversationId,
        isDeleted: false,
        id: { notIn: deletedMessageIds },
      },
    });

    const enriched = messages.reverse().map((m) => ({
      ...m,
      readByUserIds: (m as any).readReceipts?.map((r: any) => r.userId) || [],
    }))
    return NextResponse.json({
      messages: enriched,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await req.json();
    const { content, messageType, attachments } = sendMessageSchema.parse(body);

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Determine message type if attachments are provided
    const computedType = attachments && attachments.length > 0
      ? (attachments[0].fileType.startsWith('image/')
          ? 'IMAGE'
          : attachments[0].fileType.startsWith('video/')
            ? 'VIDEO'
            : 'FILE')
      : (messageType || 'TEXT')

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content,
        messageType: computedType as any,
        attachments: attachments ? {
          create: attachments,
        } : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
          },
        },
        attachments: true,
        readReceipts: true,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create notifications for other participants
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const recipientIds = participants
      .map((p) => p.userId)
      .filter((uid) => uid !== session.user.id);
    if (recipientIds.length > 0) {
      const notifTitle = messageType === 'TEXT' ? 'Pesan Baru' : 'Pesan Baru (Lampiran)';
      const senderName = (session.user as any).name || 'Seseorang';
      const notifMessage = `${senderName}: ${content.substring(0, 80)}`;
      await prisma.notification.createMany({
        data: recipientIds.map((uid) => ({
          userId: uid,
          title: notifTitle,
          message: notifMessage,
          isRead: false,
        })),
      });
    }

    // Emit socket event to recipients' user rooms and show desktop notification via service worker
    try {
      const io = (global as any).io || (require('@/lib/socket') as any).getSocketIO?.();
      if (io) {
        const payload = {
          title: 'Pesan Baru',
          message: `${(session.user as any).name || 'Seseorang'}: ${content.substring(0, 80)}`,
          conversationId,
        };
        if (recipientIds?.length) io.to(recipientIds.map((uid) => `user:${uid}`)).emit('notification', payload);
        // emit to conversation room for real-time message delivery (always)
        io.to(`conversation:${conversationId}`).emit('new_message', {
          ...message,
          sender: message.sender,
          attachments: message.attachments,
          readByUserIds: [],
        });
         // Mark delivered to recipients so sender can render grey double ticks
         if (recipientIds?.length) io.to(recipientIds.map((uid) => `user:${uid}`)).emit('delivery', { conversationId, messageId: message.id })
        // redundancy: also emit user-targeted new message event
        io.to(recipientIds.map((uid) => `user:${uid}`)).emit('new_message_user', {
          conversationId,
          id: message.id,
          brief: content.substring(0, 120),
        });
      }
    } catch {}

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Ensure user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });
    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Exclude messages deleted for this user
    const deletedMessagesRaw = await prisma.$queryRaw<Array<{ messageId: string }>>`
      SELECT messageId FROM message_deletes WHERE userId = ${session.user.id}
    `;
    const deletedMessageIds = new Set(deletedMessagesRaw.map((m) => m.messageId));

    // Find messages to mark as read: not self, not deleted for user, not already read
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        senderId: { not: session.user.id },
      },
      select: { id: true },
    });
    const messageIds = messages.map((m) => m.id).filter((id) => !deletedMessageIds.has(id));

    if (messageIds.length === 0) {
      return NextResponse.json({ marked: 0 });
    }

    const existingReads = await prisma.messageRead.findMany({
      where: { userId: session.user.id, messageId: { in: messageIds } },
      select: { messageId: true },
    });
    const readSet = new Set(existingReads.map((r) => r.messageId));
    const toCreate = messageIds.filter((id) => !readSet.has(id));

    if (toCreate.length > 0) {
      await prisma.messageRead.createMany({
        data: toCreate.map((id) => ({ messageId: id, userId: session.user.id })),
        skipDuplicates: true,
      });
    }

    // Notify via socket about read receipts
    try {
      const io = (global as any).io;
      if (io && toCreate.length > 0) {
        io.to(`conversation:${conversationId}`).emit('read_receipt', {
          conversationId,
          messageIds: toCreate,
          readerId: session.user.id,
          readAt: new Date().toISOString(),
        });
      }
    } catch {}

    return NextResponse.json({ marked: toCreate.length, messageIds: toCreate });
  } catch (error) {
    console.error('Error marking messages read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
