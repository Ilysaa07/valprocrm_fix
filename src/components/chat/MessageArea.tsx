'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { Send, Paperclip } from 'lucide-react';
import { ChatMessage } from '@/lib/socket';
// Modal removed

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
}

interface MessageAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

interface MessageAreaProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  socket: Socket | null;
}


export default function MessageArea({
  conversation,
  messages,
  onSendMessage,
  socket,
}: MessageAreaProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Smooth scroll to bottom when new message arrives quickly
  useEffect(() => {
    const t = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  // Mark as read on visibility change
  useEffect(() => {
    const onFocus = () => {
      if (socket) {
        // parent marks read via ChatLayout; rely on API already
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('user_typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversation.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...new Set([...prev, data.userId])];
          } else {
            return prev.filter(id => id !== data.userId);
          }
        });
      }
    });

    socket.on('read_receipt', (data: { conversationId: string; messageIds: string[]; readerId: string }) => {
      if (data.conversationId !== conversation.id) return
      // When any receipt arrives, we trigger a soft refresh of messages via parent API call
      // (kept simple to ensure correctness). Alternatively, we could mark local state.
    });

    socket.on('message_deleted', (data: { messageId: string; conversationId: string; deletedBy: string }) => {
      if (data.conversationId === conversation.id) {
        // Update the message to show as deleted
        // This will be handled by the parent component
      }
    });

    socket.on('message_deleted_for_me', (data: { messageId: string; conversationId: string }) => {
      if (data.conversationId === conversation.id) {
        // Remove the message from the local state
        // This will be handled by the parent component
      }
    });

    return () => {
      socket.off('user_typing');
      socket.off('message_deleted');
      socket.off('message_deleted_for_me');
      socket.off('read_receipt');
    };
  }, [socket, conversation.id]);


  const getTypingLabel = () => {
    const othersTyping = typingUsers.filter((uid) => uid && uid !== session?.user?.id);
    if (othersTyping.length === 0) return '';
    const names = othersTyping
      .map((uid) => conversation.participants.find((p) => p.user.id === uid)?.user.fullName)
      .filter(Boolean) as string[];
    if (names.length === 0) return 'Someone is typing...';
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    try {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);

      // Stop typing indicator
      if (socket) {
        socket.emit('typing_stop', {
          conversationId: conversation.id,
          userId: session?.user?.id,
        });
      }
    } catch {
      // Show error to user
      alert('Gagal mengirim pesan. Silakan coba lagi.');
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const form = new FormData();
      form.append('file', files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.file?.url) {
        onSendMessage('', [{ fileName: data.file.name, fileUrl: data.file.url, fileSize: data.file.size, fileType: data.file.type } as MessageAttachment]);
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };





  const sendMessage = () => {
    if (!message.trim()) return;

    try {
      handleSendMessage();
    } catch {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={messagesEndRef}>
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === session?.user?.id
          
          return (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 hover:shadow-xl ${
                  isOwnMessage
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-slate-700'
                }`}
              >
                {/* Message Content */}
                {msg.messageType === 'TEXT' ? (
                  <div className="break-words">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : msg.messageType === 'IMAGE' && msg.attachments && msg.attachments[0] ? (
                  <div className="space-y-2">
                    <img
                      src={msg.attachments[0].fileUrl}
                      alt="Image"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      style={{ maxHeight: '300px' }}
                    />
                    {msg.content && (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                ) : (
                  <div className="break-words">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                )}
                
                {/* Message Time */}
                <div className={`text-xs mt-2 ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-neutral-400'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-neutral-400 ml-2">{getTypingLabel()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-lg">
        <div className="flex items-end space-x-3">
          {/* File Upload Button */}
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
            title="Attach File"
          >
            <Paperclip className="w-5 h-5" />
          </button>


          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 dark:placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-full transition-all duration-200 ${
              message.trim()
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                : 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>


        {/* Hidden file input */}
        <input
          id="fileInput"
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      
    </div>
  )
}
