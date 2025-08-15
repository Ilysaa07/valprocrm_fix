'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Users, Clock, Circle, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

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
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  currentUserId,
  unreadByConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Presence indicator via window socket (if available)
  React.useEffect(() => {
    const w = window as any;
    const s = w?.socket as any;
    if (!s) return;
    const onPresence = (p: { userId: string; isOnline: boolean }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (p.isOnline) next.add(p.userId); else next.delete(p.userId);
        return next;
      });
    };
    const onList = (arr: string[]) => setOnlineUserIds(new Set(arr));
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
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-blue-500 text-white">
            <Users className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      );
    }

    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    if (otherParticipant?.user.profilePicture) {
      return (
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherParticipant.user.profilePicture} alt={otherParticipant.user.fullName} />
          <AvatarFallback className="bg-gray-100 text-gray-600">
            {otherParticipant.user.fullName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    }

    return (
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-gray-100 text-gray-600">
          {otherParticipant?.user.fullName.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
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
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
        <p className="text-gray-500">Try adjusting your search or start a new conversation.</p>
      </div>
    );
  }

  return (
    <div className="p-2 min-h-0">
      {filteredConversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id;
        const lastMessage = getLastMessage(conversation);
        const unreadCount = getUnreadCount(conversation);
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`group relative flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              isSelected 
                ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="relative">
              {getConversationAvatar(conversation)}
              {conversation.type === 'GROUP' && (
                <Badge variant="default" className="absolute -top-1 -right-1 text-xs px-1 py-0">
                  G
                </Badge>
              )}
              {conversation.type === 'DIRECT' && (() => {
                const other = conversation.participants.find(p => p.user.id !== currentUserId)?.user.id;
                const isOnline = other ? onlineUserIds.has(other) : false;
                return (
                  <span className={`absolute -bottom-1 -right-1 inline-flex items-center`}>
                    <Circle className={`w-3 h-3 ${isOnline ? 'text-green-500' : 'text-gray-300'}`} />
                  </span>
                );
              })()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-medium truncate ${
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {getConversationDisplayName(conversation)}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {lastMessage.time}
                  </span>
                  {unreadCount > 0 && (
                  <Badge variant="danger" className="text-xs px-1.5 py-0.5">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <p className={`text-sm truncate ${
                isSelected ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {lastMessage.content}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                title="Hapus percakapan untuk saya"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    await fetch(`/api/chat/conversations/${conversation.id}`, { method: 'DELETE' })
                    location.reload()
                  } catch {}
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete conversation modal removed */}
    </div>
  );
}
