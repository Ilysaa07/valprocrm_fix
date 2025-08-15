import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1),
  name: z.string().optional(),
  type: z.enum(['DIRECT', 'GROUP']).default('DIRECT'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';

    // Fetch deleted conversation IDs via raw query to avoid client regeneration issues
    const deletedConversationsRaw = await prisma.$queryRaw<Array<{ conversationId: string }>>`
      SELECT conversationId FROM conversation_deletes WHERE userId = ${session.user.id}
    `;
    const deletedConversationIds = deletedConversationsRaw.map((d) => d.conversationId);

    // Fetch deleted message IDs via raw query (to exclude from last-message include)
    const deletedMessagesRaw = await prisma.$queryRaw<Array<{ messageId: string }>>`
      SELECT messageId FROM message_deletes WHERE userId = ${session.user.id}
    `;
    const deletedMessageIds = deletedMessagesRaw.map((m) => m.messageId);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            leftAt: archived ? { not: null } : null,
          },
        },
        isArchived: archived,
        id: { notIn: deletedConversationIds },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profilePicture: true,
                role: true,
              },
            },
          },
        },
        messages: {
          where: {
            isDeleted: false,
            id: { notIn: deletedMessageIds },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute unread counts per conversation for current user (exclude deleted-for-user)
    const unreadRows = await prisma.$queryRaw<Array<{ conversationId: string; unreadCount: number }>>`
      SELECT m.conversationId as conversationId, COUNT(*) as unreadCount
      FROM messages m
      INNER JOIN conversation_participants cp ON cp.conversationId = m.conversationId AND cp.userId = ${session.user.id}
      LEFT JOIN message_reads mr ON mr.messageId = m.id AND mr.userId = ${session.user.id}
      LEFT JOIN message_deletes md ON md.messageId = m.id AND md.userId = ${session.user.id}
      WHERE m.isDeleted = 0 AND md.messageId IS NULL AND m.senderId <> ${session.user.id} AND mr.messageId IS NULL
      GROUP BY m.conversationId
    `;
    const unreadCounts: Record<string, number> = {};
    unreadRows.forEach((row) => {
      unreadCounts[row.conversationId] = Number(row.unreadCount || 0);
    });

    return NextResponse.json({ conversations, unreadCounts });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { participantIds, name, type } = createConversationSchema.parse(body);

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([session.user.id, ...participantIds])];

    // Validate that all participant IDs exist to avoid FK errors
    // Resolve emails to IDs if the UI sent emails by mistake
    const resolvedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: allParticipantIds } },
          { email: { in: allParticipantIds } },
        ],
      },
      select: { id: true, email: true },
    });
    const idByEmail = new Map(resolvedUsers.map(u => [u.email, u.id] as const));
    const normalizedParticipantIds = allParticipantIds.map(v => idByEmail.get(v) || v);

    // Resolve current user from DB to ensure valid FK id
    const currentUserDb = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.id },
          { email: session.user.email as string },
        ],
      },
      select: { id: true },
    });

    const participants = await prisma.user.findMany({
      where: { id: { in: normalizedParticipantIds } },
      select: { id: true },
    });
    const foundIds = new Set(participants.map(p => p.id));
    // Build final participant ids only from existing users
    const finalParticipantIds = Array.from(new Set([
      ...normalizedParticipantIds.filter(id => foundIds.has(id)),
      ...(currentUserDb?.id ? [currentUserDb.id] : []),
    ]));
    const currentUserIdForRole = currentUserDb?.id ?? session.user.id;

    // Additional validations
    if (type === 'DIRECT') {
      const otherIds = finalParticipantIds.filter((id) => id !== currentUserIdForRole);
      if (otherIds.length < 1) {
        return NextResponse.json(
          { error: 'Please select one other valid participant' },
          { status: 400 }
        );
      }
    }
    if (type === 'GROUP') {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: 'Group name is required' },
          { status: 400 }
        );
      }
      if (finalParticipantIds.length < 2) {
        return NextResponse.json(
          { error: 'Group conversations require at least two valid participants' },
          { status: 400 }
        );
      }
    }

    // For direct conversations, check if one already exists
    let directPair: string[] | null = null;
    if (type === 'DIRECT') {
      directPair = [
        currentUserIdForRole,
        ...finalParticipantIds.filter((id) => id !== currentUserIdForRole),
      ].slice(0, 2);
      if (directPair.length !== 2) {
        return NextResponse.json(
          { error: 'Please select one other valid participant' },
          { status: 400 }
        );
      }
      const [a, b] = directPair;
      console.log('Create DIRECT conversation debug', {
        originalParticipantIds: participantIds,
        allParticipantIds,
        normalizedParticipantIds,
        finalParticipantIds,
        pair: directPair,
        currentUserId: currentUserIdForRole,
      });
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: a } } },
            { participants: { some: { userId: b } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        // If user previously deleted this conversation, undelete it for them
        await prisma.$executeRaw`
          DELETE FROM conversation_deletes WHERE conversationId = ${existingConversation.id} AND userId = ${session.user.id}
        `;
        return NextResponse.json({ conversation: existingConversation });
      }
    }

    // Create new conversation
    try {
      console.log('Create conversation debug before insert', {
        type,
        name,
        finalParticipantIds,
        currentUserId: currentUserIdForRole,
      });
      const conversation = await prisma.conversation.create({
        data: {
          name: type === 'GROUP' ? name : null,
          type,
          participants: {
            create:
              type === 'DIRECT' && directPair
                ? [
                    { userId: directPair[0], role: 'ADMIN' },
                    { userId: directPair[1], role: 'MEMBER' },
                  ]
                : finalParticipantIds.map((userId) => ({
                    userId,
                    role: userId === currentUserIdForRole ? 'ADMIN' : 'MEMBER',
                  })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  profilePicture: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ conversation }, { status: 201 });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'P2003') {
        console.error('P2003 FK violation on conversation create', {
          finalParticipantIds,
          currentUserId: currentUserIdForRole,
          message: e?.message,
        });
        return NextResponse.json(
          { error: 'One or more participants do not exist (FK violation)', details: { participantIds: finalParticipantIds } },
          { status: 400 }
        );
      }
      throw new Error(e?.message || 'unknown');
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
