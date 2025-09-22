'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Users, Clock, Circle, Trash2 } from 'lucide-react';
// Using simple avatar logic (img or initial) inline to avoid broken Avatar component
import Badge from '@/components/ui/Badge';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading: boolean;
  currentUserId: string;
  unreadByConversation?: Record<string, number>;
  isMobile?: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  currentUserId,
  unreadByConversation,
  isMobile = false,
}: ConversationListProps) {
  const [searchQuery] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Presence indicator via window socket (if available)
  React.useEffect(() => {
    interface SocketApi {
      emit: (event: string, ...args: unknown[]) => void
      on: (event: string, cb: (...args: unknown[]) => void) => void
      off: (event: string, cb: (...args: unknown[]) => void) => void
    }
    interface WindowWithSocket extends Window { socket?: SocketApi }
    const w = window as unknown as WindowWithSocket;
    const s = w?.socket;
    if (!s) return;
    const onPresence = (p: unknown) => {
      const payload = p as { userId: string; isOnline: boolean }
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (payload.isOnline) next.add(payload.userId); else next.delete(payload.userId);
        return next;
      });
    };
    const onList = (arr: unknown) => setOnlineUserIds(new Set((arr as string[]) || []));
    s.emit('get_online_users');
    s.on('presence_update', onPresence);
    s.on('online_users', onList);
    return () => {
      s.off('presence_update', onPresence);
      s.off('online_users', onList);
    };
  }, []);

  const filteredConversations = conversations.filter(conversation => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const participantNames = conversation.participants
        .map(p => p.user.fullName.toLowerCase())
        .join(' ');
      const conversationName = conversation.name?.toLowerCase() || '';
      const lastMessage = conversation.messages?.[0]?.content?.toLowerCase() || '';
      
      return participantNames.includes(query) || 
             conversationName.includes(query) || 
             lastMessage.includes(query);
    }
    return true;
  });

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.type === 'GROUP' && conversation.name) {
      return conversation.name;
    }
    
    // For direct conversations, show the other participant's name
    const otherParticipants = conversation.participants.filter(p => p.user.id !== currentUserId);
    return otherParticipants.map(p => p.user.fullName).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'GROUP') {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 text-white flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      );
    }

    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    if (otherParticipant?.user.profilePicture) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-gray-600">
          <img
            src={otherParticipant.user.profilePicture}
            alt={otherParticipant.user.fullName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
              const next = e.currentTarget.nextElementSibling as HTMLElement | null
              if (next) next.classList.remove('hidden')
            }}
          />
          <span className="hidden">
            {otherParticipant.user.fullName.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 text-gray-600 flex items-center justify-center">
        {otherParticipant?.user.fullName.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  };

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages?.[0];
    if (!lastMessage) return { content: 'No messages yet', time: '' };
    
    return {
      content: lastMessage.content.length > 50 
        ? `${lastMessage.content.substring(0, 50)}...` 
        : lastMessage.content,
      time: formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
    };
  };

  const getUnreadCount = (conversation: Conversation) => {
    return unreadByConversation?.[conversation.id] || 0;
  };

  // Delete conversation feature removed

  if (isLoading) {
    return (
      <div className={`${isMobile ? 'p-2' : 'p-4'} space-y-3 sm:space-y-4`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex items-center space-x-3 animate-pulse ${isMobile ? 'p-2' : 'p-3'}`}>
            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gray-200 dark:bg-slate-700 rounded-full`}></div>
            <div className="flex-1 space-y-2">
              <div className={`${isMobile ? 'h-3' : 'h-4'} bg-gray-200 dark:bg-slate-700 rounded w-3/4`}></div>
              <div className={`${isMobile ? 'h-2' : 'h-3'} bg-gray-200 dark:bg-slate-700 rounded w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className={`${isMobile ? 'p-4' : 'p-8'} text-center`}>
        <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center`}>
          <Search className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 dark:text-gray-500`} />
        </div>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white mb-2`}>No conversations found</h3>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500 dark:text-gray-400`}>Try adjusting your search or start a new conversation.</p>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-1' : 'p-2'} min-h-0`}>
      {filteredConversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id;
        const lastMessage = getLastMessage(conversation);
        const unreadCount = getUnreadCount(conversation);
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`group relative flex items-center space-x-2 sm:space-x-3 ${isMobile ? 'p-3' : 'p-4'} rounded-xl cursor-pointer transition-all duration-200 chat-mobile-conversation chat-mobile-touch chat-mobile-transition ${
              isSelected 
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 shadow-lg ring-1 ring-blue-200/50 dark:ring-blue-800/30' 
                : 'hover:bg-gray-50 dark:hover:bg-slate-700 border border-transparent hover:shadow-md'
            }`}
          >
            <div className="relative">
              {getConversationAvatar(conversation)}
              {conversation.type === 'GROUP' && (
                <Badge variant="default" className={`absolute -top-1 -right-1 ${isMobile ? 'text-xs px-0.5 py-0' : 'text-xs px-1 py-0'}`}>
                  G
                </Badge>
              )}
              {conversation.type === 'DIRECT' && (() => {
                const other = conversation.participants.find(p => p.user.id !== currentUserId)?.user.id;
                const isOnline = other ? onlineUserIds.has(other) : false;
                return (
                  <span className={`absolute -bottom-1 -right-1 inline-flex items-center`}>
                    <Circle className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} ${isOnline ? 'text-green-500' : 'text-gray-300 dark:text-neutral-600'}`} />
                  </span>
                );
              })()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`${isMobile ? 'text-sm' : 'text-sm'} font-semibold truncate ${
                  isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                }`}>
                  {getConversationDisplayName(conversation)}
                </h3>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-neutral-400 flex items-center`}>
                    <Clock className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} />
                    <span className={isMobile ? 'hidden sm:inline' : ''}>{lastMessage.time}</span>
                  </span>
                  {unreadCount > 0 && (
                  <Badge variant="danger" className={`${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-1.5 py-0.5'}`}>
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} truncate ${
                isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {lastMessage.content}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                title="Hapus percakapan untuk saya"
                className={`opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 ${isMobile ? 'p-1' : 'p-1'}`}
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    await fetch(`/api/chat/conversations/${conversation.id}`, { method: 'DELETE' })
                    location.reload()
                  } catch {}
                }}
              >
                <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete conversation modal removed */}
    </div>
  );
}
