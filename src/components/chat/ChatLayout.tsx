'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import ChatHeader from './ChatHeader';
import NewConversationModal from './NewConversationModal';
import { ChatMessage } from '@/lib/socket';
import { Card } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';

interface Conversation {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP';
  participants: Array<{
    user: {
      id: string;
      fullName: string;
      email: string;
      profilePicture?: string;
      role: string;
    };
    role: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      fullName: string;
    };
  }>;
  _count: {
    messages: number;
  };
  updatedAt: string;
}

export default function ChatLayout() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Initialize Socket.IO
    const newSocket = io();

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', {
        userId: session.user.id,
        name: session.user.fullName,
        role: (session.user as { role?: string }).role,
      });
    });

    newSocket.on('authenticated', () => {
      console.log('Socket authenticated');
      fetchConversations();
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      const activeId = selectedConversationRef.current?.id;
      if (activeId && message.conversationId === activeId) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          const filtered = prev.filter(m => !String(m.id).startsWith('temp-'));
          return [...filtered, message];
        });
      }
      
      setConversations(prev => {
        const idx = prev.findIndex(conv => conv.id === message.conversationId);
        if (idx === -1) return prev;
        const updated = {
          ...prev[idx],
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: message.id,
              content: message.messageType === 'TEXT' ? message.content : 'Message',
              createdAt: new Date().toISOString(),
              sender: { id: message.senderId, fullName: message.sender?.fullName || '' },
              read: message.senderId === session!.user!.id,
            },
          ],
        } as Conversation;
        const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return next;
      });
      
      if (message.senderId !== session!.user!.id) {
        setUnreadByConversation(prev => {
          const isActive = activeId === message.conversationId;
          if (isActive) return prev;
          const current = prev[message.conversationId] || 0;
          return { ...prev, [message.conversationId]: current + 1 };
        });
      }
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session?.user?.id]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        const uniqueConversations = data.conversations.filter((conversation: Conversation, index: number, self: Conversation[]) => 
          index === self.findIndex((c) => c.id === conversation.id)
        );
        setConversations(uniqueConversations);
        if (data.unreadCounts) {
          setUnreadByConversation(data.unreadCounts as Record<string, number>);
        }
        if (socketRef.current) {
          uniqueConversations.forEach((c: Conversation) => socketRef.current!.emit('join_conversation', c.id));
        }
        
        const cid = searchParams?.get('c');
        if (cid) {
          const target = uniqueConversations.find((c: Conversation) => c.id === cid);
          if (target) {
            handleConversationSelect(target);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const uniqueMessages = data.messages.filter((message: ChatMessage, index: number, self: ChatMessage[]) => 
          index === self.findIndex((m) => m.id === message.id)
        );
        setMessages(uniqueMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    selectedConversationRef.current = conversation;
    setMessages([]);
    fetchMessages(conversation.id);
    markAllRead(conversation.id);
    setUnreadByConversation(prev => ({ ...prev, [conversation.id]: 0 }));
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conversation.id);
    }
  };

  const markAllRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/messages`, { method: 'PATCH' });
    } catch {
      // ignore
    }
  };

  type AttachmentInput = { fileName: string; fileUrl: string; fileSize: number; fileType: string };
  const handleSendMessage = async (content: string, attachments?: AttachmentInput[]) => {
    if (!selectedConversation || !socket) return;

    try {
      const tempId = `temp-${Date.now()}`;
      const userIdSafe = session?.user?.id || '';
      const userNameSafe = session?.user?.name || 'You';
      const userImageSafe = (session?.user as unknown as { image?: string })?.image || undefined;
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId: selectedConversation.id,
        senderId: userIdSafe,
        content,
        messageType: attachments && attachments.length > 0
          ? (attachments[0].fileType.startsWith('image/') ? 'IMAGE' : attachments[0].fileType.startsWith('video/') ? 'VIDEO' : 'FILE')
          : 'TEXT',
        attachments: attachments || [],
        createdAt: new Date(),
        sender: {
          id: userIdSafe,
          fullName: userNameSafe,
          profilePicture: userImageSafe,
        },
      } as unknown as ChatMessage;
      setMessages(prev => [...prev, optimistic]);

      fetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('send failed');
          const saved: ChatMessage = await res.json();
          setMessages((prev: ChatMessage[]) => {
            const alreadyExists = prev.some((m) => m.id === (saved as any).id);
            if (alreadyExists) {
              return prev.filter((m) => m.id !== tempId);
            }
            return prev.map((m) => (m.id === tempId ? (saved as any) : m));
          });
        })
        .catch(() => {
          setMessages((prev: ChatMessage[]) => prev.filter((m) => m.id !== tempId));
        });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleNewConversation = (conversation: Conversation) => {
    setConversations(prev => {
      const conversationExists = prev.some(conv => conv.id === conversation.id);
      if (conversationExists) {
        return prev;
      }
      return [conversation, ...prev];
    });
    setSelectedConversation(conversation);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <Card className="p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Authentication Required</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Please sign in to access the chat feature.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-0 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      {/* Sidebar */}
      <aside className={`${selectedConversation && isMobile ? 'hidden' : 'flex'} w-full md:w-88 lg:w-[420px] xl:w-[460px] flex-col min-h-0 border-r border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm`}> 
        <ChatHeader 
          onNewChat={() => setShowNewConversationModal(true)}
          onSearch={() => {}}
          totalUnread={Object.values(unreadByConversation).reduce((a, b) => a + (b || 0), 0)}
        />
        <Separator />
        <ScrollArea className="flex-1 min-h-0">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleConversationSelect}
            isLoading={isLoading}
            currentUserId={session.user.id}
            unreadByConversation={unreadByConversation}
          />
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <main className={`${!selectedConversation && isMobile ? 'hidden' : 'flex'} flex-1 min-w-0 min-h-0`}> 
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-h-0">
            <MessageArea
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              socket={socket}
              onBack={() => setSelectedConversation(null)}
              isMobile={isMobile}
              unreadCount={unreadByConversation[selectedConversation.id] || 0}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Welcome to Chat</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Select a conversation to get started</p>
            </div>
          </div>
        )}
      </main>

      <NewConversationModal isOpen={showNewConversationModal} onClose={() => setShowNewConversationModal(false)} onConversationCreated={handleNewConversation} />
    </div>
  );
}
