'use client';

import React, { useState, useEffect, useRef } from 'react';
import { showSuccess, showError, showConfirm } from '@/lib/swal';
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
import { Button } from '@/components/ui/Button';
import { MessageCircle, Plus } from 'lucide-react';

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
  const [showConversationList, setShowConversationList] = useState(true);
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

  // Handle mobile back button behavior
  useEffect(() => {
    if (!isMobile) return;

    const handlePopState = () => {
      if (selectedConversation && !showConversationList) {
        setShowConversationList(true);
        setSelectedConversation(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobile, selectedConversation, showConversationList]);

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
    
    // On mobile, hide conversation list when selecting a conversation
    if (isMobile) {
      setShowConversationList(false);
      // Push state to history for back button support
      window.history.pushState({ conversationId: conversation.id }, '', `?c=${conversation.id}`);
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
    if (!selectedConversation || !socket) {
      console.error('No conversation selected or socket not connected');
      return;
    }

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
      
      // Add optimistic message
      setMessages(prev => [...prev, optimistic]);

      // Send to API
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const saved: ChatMessage = await response.json();
      
      // Replace optimistic message with real message
      setMessages((prev: ChatMessage[]) => {
        const alreadyExists = prev.some((m) => m.id === (saved as any).id);
        if (alreadyExists) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? (saved as any) : m));
      });

      // message persisted
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages((prev: ChatMessage[]) => prev.filter((m) => m.id !== tempId));
      
      // Show error to user
      await showError("Error!", 'Gagal mengirim pesan. Silakan coba lagi.');
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
    <div className={`flex min-h-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 chat-mobile-scroll ${
      isMobile ? 'h-[calc(100dvh-120px)]' : 'h-[100dvh]'
    }`}>
      {/* Sidebar - Mobile optimized */}
      <aside className={`${
        isMobile 
          ? (showConversationList ? 'flex' : 'hidden') 
          : 'flex'
      } w-full md:w-88 lg:w-[420px] xl:w-[460px] flex-col min-h-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg`}> 
        <ChatHeader 
          onNewChat={() => setShowNewConversationModal(true)}
          onSearch={() => {}}
          totalUnread={Object.values(unreadByConversation).reduce((a, b) => a + (b || 0), 0)}
          isMobile={isMobile}
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
            isMobile={isMobile}
          />
        </ScrollArea>
      </aside>

      {/* Chat area - Mobile optimized */}
      <main className={`${
        isMobile 
          ? (showConversationList ? 'hidden' : 'flex') 
          : 'flex'
      } flex-1 min-w-0 min-h-0`}> 
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-h-0">
            <MessageArea
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              socket={socket}
              onBack={() => {
                if (isMobile) {
                  setShowConversationList(true);
                  setSelectedConversation(null);
                  // Update URL when going back
                  window.history.pushState({}, '', window.location.pathname);
                } else {
                  setSelectedConversation(null);
                }
              }}
              isMobile={isMobile}
              unreadCount={unreadByConversation[selectedConversation.id] || 0}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <div className="text-center max-w-md w-full px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Welcome to Chat</h3>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-4 sm:mb-6">Select a conversation to get started</p>
              <Button
                onClick={() => setShowNewConversationModal(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </main>

      <NewConversationModal 
        isOpen={showNewConversationModal} 
        onClose={() => setShowNewConversationModal(false)} 
        onConversationCreated={handleNewConversation}
        isMobile={isMobile}
      />
    </div>
  );
}
