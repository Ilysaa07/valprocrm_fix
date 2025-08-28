'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { Send, Paperclip, Smile, ArrowLeft, MoreVertical, Clock, FileText, Mic } from 'lucide-react';
import ReactionPicker from './ReactionPicker';
import { ChatMessage } from '@/lib/socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Badge from '@/components/ui/Badge';
import EmojiPicker from './EmojiPicker';
import StickerPicker from './StickerPicker';
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
  onBack: () => void;
  isMobile: boolean;
  unreadCount?: number;
}

// Global audio manager to ensure only one audio plays at a time
class AudioManager {
  private static instance: AudioManager
  private currentAudio: HTMLAudioElement | null = null
  private currentButton: HTMLButtonElement | null = null

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  playAudio(audio: HTMLAudioElement, button: HTMLButtonElement): void {
    // Stop current audio if exists
    if (this.currentAudio && this.currentAudio !== audio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      if (this.currentButton) {
        this.updateButtonIcon(this.currentButton, false)
      }
    }

    // Set new current audio
    this.currentAudio = audio
    this.currentButton = button

    // Play the new audio
    audio.play()
    this.updateButtonIcon(button, true)
  }

  pauseAudio(audio: HTMLAudioElement, button: HTMLButtonElement): void {
    audio.pause()
    this.updateButtonIcon(button, false)
    
    // Clear current audio if it's the same
    if (this.currentAudio === audio) {
      this.currentAudio = null
      this.currentButton = null
    }
  }

  stopAll(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      if (this.currentButton) {
        this.updateButtonIcon(this.currentButton, false)
      }
      this.currentAudio = null
      this.currentButton = null
    }
  }

  private updateButtonIcon(button: HTMLButtonElement, isPlaying: boolean): void {
    if (isPlaying) {
      button.innerHTML = `
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clip-rule="evenodd" />
        </svg>
      `
    } else {
      button.innerHTML = `
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
      `
    }
  }
}

// Get global audio manager instance
const audioManager = AudioManager.getInstance()

export default function MessageArea({
  conversation,
  messages,
  onSendMessage,
  socket,
  onBack,
  isMobile,
  unreadCount,
}: MessageAreaProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showReactions, setShowReactions] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const longPressRef = useRef<number | null>(null);
  // Delete message feature removed
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

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

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioManager.stopAll()
    }
  }, [])

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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      if (socket) {
        socket.emit('typing_start', {
          conversationId: conversation.id,
          userId: session?.user?.id,
        });
      }
    }

    // Clear typing indicator after 2 seconds of no typing
    setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing_stop', {
          conversationId: conversation.id,
          userId: session?.user?.id,
        });
      }
    }, 2000);
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
        const fileType = String(data.file.type || '').toLowerCase();
        const isImage = fileType.startsWith('image/');
        const isVideo = fileType.startsWith('video/');
        const msgType = isImage ? 'IMAGE' : isVideo ? 'VIDEO' : 'FILE';
        onSendMessage('', [{ fileName: data.file.name, fileUrl: data.file.url, fileSize: data.file.size, fileType: data.file.type } as any]);
        // Optional: show placeholder while sending handled upstream
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000)
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const startRecording = async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/wav']
      const mime = mimeTypes.find((t) => (window as any).MediaRecorder && (window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported(t)) || 'audio/webm;codecs=opus'
      
      const rec: any = new (window as any).MediaRecorder(stream, { mimeType: mime })
      recordChunksRef.current = []
      
      rec.ondataavailable = (e: BlobEvent) => { 
        if (e.data && e.data.size > 0) {
          recordChunksRef.current.push(e.data)
        }
      }
      
      rec.onstart = () => {
      }
      
      rec.onstop = async () => {
        setIsRecording(false)
        if (recordTimerRef.current) { 
          window.clearInterval(recordTimerRef.current); 
          recordTimerRef.current = null 
        }
        setRecordMs(0)
        stream.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
        
        // Check if we have any data
        if (recordChunksRef.current.length === 0) {
          return
        }
        
        const blob = new Blob(recordChunksRef.current, { type: rec.mimeType || 'audio/webm' })
        
        if (blob.size === 0) {
          return
        }
        
        const fileName = `voice_${Date.now()}.${rec.mimeType?.includes('ogg') ? 'ogg' : 'webm'}`
        const file = new File([blob], fileName, { type: blob.type })
        const form = new FormData()
        form.append('file', file)
        
        try {
        const res = await fetch(`/api/chat/conversations/${conversation.id}/voice`, { method: 'POST', body: form })
        if (res.ok) {
          // Voice note sent successfully
        }
        } catch (error) {
      }
      }
      
      rec.start(100)
      mediaRecorderRef.current = rec
      setIsRecording(true)
      const startAt = Date.now()
      recordTimerRef.current = window.setInterval(() => setRecordMs(Date.now() - startAt), 200)
    } catch (e) {
    }
  }

  const stopRecording = () => {
    const rec = mediaRecorderRef.current
    if (rec && isRecording) {
      try { 
        // Request any remaining data before stopping
        rec.requestData()
        // Small delay to ensure data is processed
        setTimeout(() => {
          rec.stop()
        }, 100)
      } catch (error) {
        rec.stop()
      }
    }
  }

  const cancelRecording = () => {
    const rec = mediaRecorderRef.current
    if (rec && isRecording) {
      rec.onstop = () => {
        // discard
        setIsRecording(false)
        if (recordTimerRef.current) { 
          window.clearInterval(recordTimerRef.current); 
          recordTimerRef.current = null 
        }
        setRecordMs(0)
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
      }
      }
      try { 
        rec.requestData()
        setTimeout(() => {
          rec.stop()
        }, 50)
      } catch (error) {
        rec.stop()
      }
      recordChunksRef.current = []
    }
  }

  // Delete message handlers removed

  const getConversationName = () => {
    if (conversation.type === 'GROUP' && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipants = conversation.participants.filter(
      p => p.user.id !== session?.user?.id
    );
    return otherParticipants.map(p => p.user.fullName).join(', ');
  };

  const getParticipantAvatars = () => {
    if (conversation.type === 'GROUP') {
      return (
        <div className="flex -space-x-2">
          {conversation.participants.slice(0, 3).map((participant) => (
            <Avatar key={participant.user.id} className="w-8 h-8 border-2 border-white">
              <AvatarImage src={participant.user.profilePicture} alt={participant.user.fullName} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                    {participant.user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
          {conversation.participants.length > 3 && (
            <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs text-gray-600">
                +{conversation.participants.length - 3}
              </span>
            </div>
          )}
        </div>
      );
    }

    const otherParticipant = conversation.participants.find(
      p => p.user.id !== session?.user?.id
    );

      return (
      <Avatar className="w-8 h-8">
        <AvatarImage src={otherParticipant?.user.profilePicture} alt={otherParticipant?.user.fullName} />
        <AvatarFallback className="bg-gray-100 text-gray-600">
          {otherParticipant?.user.fullName.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
    );
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = msg.sender?.id === session?.user?.id;
    const messageTime = format(new Date(msg.createdAt), 'HH:mm');
    const isDeleted = msg.messageType === 'DELETED';

    // Debug logging for voice notes
    if (msg.messageType === 'AUDIO') {
      console.log('Rendering AUDIO message:', {
        id: msg.id,
        content: msg.content,
        attachments: msg.attachments,
        messageType: msg.messageType,
        fullMessage: msg
      })
      
      // Check if attachments exist and have the right structure
      if (msg.attachments && msg.attachments.length > 0) {
      } else {
      }
    }

    return (
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
      >
        <div
          className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md relative`}
          onMouseLeave={() => setActiveMenuId((prev) => (prev === msg.id ? null : prev))}
        >
          {!isOwnMessage && msg.sender && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={msg.sender.profilePicture} alt={msg.sender.fullName} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                {msg.sender.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`}>
            {!isOwnMessage && msg.sender && (
              <span className="text-xs text-gray-500 mb-1">{msg.sender.fullName}</span>
            )}
            
            <div
              className={`rounded-2xl px-4 py-2 max-w-full relative ${
              isOwnMessage 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
              } ${isDeleted ? 'opacity-60' : ''}`}
              onTouchStart={() => {
                if (longPressRef.current) window.clearTimeout(longPressRef.current)
                // long-press 450ms to open menu (mobile friendly)
                longPressRef.current = window.setTimeout(() => setActiveMenuId(msg.id), 450)
              }}
              onTouchEnd={() => {
                if (longPressRef.current) window.clearTimeout(longPressRef.current)
                longPressRef.current = null
              }}
            >
              {msg.messageType === 'IMAGE' && msg.attachments && msg.attachments[0] ? (
                // Image preview
                <img src={msg.attachments[0].fileUrl} alt={msg.attachments[0].fileName} className="max-w-[260px] rounded" />
              ) : msg.messageType === 'VIDEO' && msg.attachments && msg.attachments[0] ? (
                <video src={msg.attachments[0].fileUrl} className="max-w-[260px] rounded" controls />
              ) : msg.messageType === 'AUDIO' && msg.attachments && msg.attachments[0] ? (
                // WhatsApp-style voice note UI
                <div className="flex items-center space-x-3 min-w-[200px] max-w-[320px] p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  {/* Play/Pause Button */}
                  <button 
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                      isOwnMessage 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-2 border-blue-200' 
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 border-2 border-gray-300'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                      const button = e.currentTarget as HTMLButtonElement
                      if (audio) {
                        if (audio.paused) {
                          // Use AudioManager to play audio
                          audioManager.playAudio(audio, button)
                        } else {
                          // Use AudioManager to pause audio
                          audioManager.pauseAudio(audio, button)
                        }
                      }
                    }}
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Voice Note Content */}
                  <div className="flex-1">
                    {/* Duration Display - Show before playing */}
                    <div className="mb-2 text-center">
                      <span className={`text-sm font-semibold ${
                        isOwnMessage ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        <span className="total-duration-display">Loading...</span>
                      </span>
                    </div>
                    
                    {/* Time Slider */}
                    <div className="mb-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value="0"
                        step="0.1"
                        className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, #e5e7eb 0%)`
                        }}
                        onChange={(e) => {
                          const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                          if (audio && audio.duration && isFinite(audio.duration)) {
                            const sliderValue = parseFloat(e.target.value)
                            if (isFinite(sliderValue) && sliderValue >= 0 && sliderValue <= 100) {
                              const seekTime = (sliderValue / 100) * audio.duration
                              if (isFinite(seekTime) && seekTime >= 0 && seekTime <= audio.duration) {
                                audio.currentTime = seekTime
                              }
                            }
                          }
                        }}
                        onInput={(e) => {
                          const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                          if (audio && audio.duration && isFinite(audio.duration)) {
                            const sliderValue = parseFloat(e.currentTarget.value)
                            if (isFinite(sliderValue) && sliderValue >= 0 && sliderValue <= 100) {
                              const currentTime = (sliderValue / 100) * audio.duration
                              if (isFinite(currentTime) && currentTime >= 0) {
                                const minutes = Math.floor(currentTime / 60)
                                const seconds = Math.floor(currentTime % 60)
                                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                                
                                // Update the current time display
                                const currentTimeSpan = e.currentTarget.parentElement?.parentElement?.querySelector('.current-time')
                                if (currentTimeSpan) {
                                  currentTimeSpan.textContent = timeString
                                }
                              }
                            }
                          }
                        }}
                      />
                      <style jsx>{`
                        .slider::-webkit-slider-thumb {
                          appearance: none;
                          height: 20px;
                          width: 20px;
                          border-radius: 50%;
                          background: ${isOwnMessage ? '#3b82f6' : '#6b7280'};
                          cursor: pointer;
                          border: 3px solid white;
                          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                          transition: all 0.2s ease;
                        }
                        .slider::-webkit-slider-thumb:hover {
                          transform: scale(1.1);
                          box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                        }
                        .slider::-moz-range-thumb {
                          height: 20px;
                          width: 20px;
                          border-radius: 50%;
                          background: ${isOwnMessage ? '#3b82f6' : '#6b7280'};
                          cursor: pointer;
                          border: 3px solid white;
                          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                        }
                        .slider:focus {
                          outline: none;
                        }
                      `}</style>
                    </div>
                    
                    {/* Progress and File Info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${
                        isOwnMessage ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        <span className="current-time">0:00</span> / <span className="total-duration">0:00</span>
                      </span>
                      <span className={`${
                        isOwnMessage ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {msg.attachments[0].fileName.includes('webm') ? 'Voice Message' : 'Audio'}
                      </span>
                    </div>
                  </div>

                  {/* Hidden audio element for actual playback */}
                  <audio 
                    className="hidden" 
                    src={msg.attachments[0].fileUrl} 
                    onLoadedMetadata={(e) => {
                      const audio = e.currentTarget
                      const button = audio.parentElement?.querySelector('button')
                      const slider = audio.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
                      if (button && audio.duration && isFinite(audio.duration) && slider) {
                        const duration = Math.round(audio.duration)
                        if (isFinite(duration) && duration > 0) {
                          const minutes = Math.floor(duration / 60)
                          const seconds = duration % 60
                          const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                          
                          // Set slider max value
                          slider.setAttribute('max', '100')
                          
                          // Update the total duration display
                          const totalDurationSpan = button.parentElement?.parentElement?.querySelector('.total-duration')
                          if (totalDurationSpan) {
                            totalDurationSpan.textContent = timeString
                          }
                          
                          // Update the duration display above slider
                          const totalDurationDisplay = button.parentElement?.parentElement?.querySelector('.total-duration-display')
                          if (totalDurationDisplay) {
                            totalDurationDisplay.textContent = timeString
                          }
                        }
                      }
                    }}
                    onTimeUpdate={(e) => {
                      const audio = e.currentTarget
                      const slider = audio.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
                      const button = audio.parentElement?.querySelector('button')
                      
                      if (slider && audio.duration && isFinite(audio.duration) && isFinite(audio.currentTime)) {
                        const progress = (audio.currentTime / audio.duration) * 100
                        if (isFinite(progress) && progress >= 0 && progress <= 100) {
                          slider.value = progress.toString()
                          
                          // Update slider background
                          slider.style.background = `linear-gradient(to right, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, ${isOwnMessage ? '#3b82f6' : '#6b7280'} ${progress}%, #e5e7eb ${progress}%)`
                        }
                      }
                      
                      // Update current time display
                      if (button && isFinite(audio.currentTime)) {
                        const currentMinutes = Math.floor(audio.currentTime / 60)
                        const currentSeconds = Math.floor(audio.currentTime % 60)
                        const currentTimeString = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`
                        
                        const currentTimeSpan = button.parentElement?.parentElement?.querySelector('.current-time')
                        if (currentTimeSpan) {
                          currentTimeSpan.textContent = currentTimeString
                        }
                      }
                    }}
                    onInput={(e) => {
                      const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                      if (audio && audio.duration && isFinite(audio.duration)) {
                        const sliderValue = parseFloat(e.currentTarget.value)
                        if (isFinite(sliderValue) && sliderValue >= 0 && sliderValue <= 100) {
                          const currentTime = (sliderValue / 100) * audio.duration
                          if (isFinite(currentTime) && currentTime >= 0) {
                            const minutes = Math.floor(currentTime / 60)
                            const seconds = Math.floor(currentTime % 60)
                            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                            
                            // Update the current time display
                            const currentTimeSpan = e.currentTarget.parentElement?.parentElement?.querySelector('.current-time')
                            if (currentTimeSpan) {
                              currentTimeSpan.textContent = timeString
                            }
                          }
                        }
                      }
                    }}
                    onEnded={(e) => {
                      const audio = e.currentTarget
                      const button = audio.parentElement?.querySelector('button')
                      const slider = audio.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
                      
                      // Reset button icon
                      if (button) {
                        button.innerHTML = `
                          <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                          </svg>
                        `
                      }
                      
                      // Reset slider
                      if (slider) {
                        slider.value = '0'
                        slider.style.background = `linear-gradient(to right, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, #e5e7eb 0%)`
                      }
                      
                      // Reset time display
                      const currentTimeSpan = button?.parentElement?.parentElement?.querySelector('.current-time')
                      if (currentTimeSpan) {
                        currentTimeSpan.textContent = '0:00'
                      }
                      
                      // Clear from AudioManager
                      audioManager.stopAll()
                    }}
                    onPause={(e) => {
                      const audio = e.currentTarget
                      const button = audio.parentElement?.querySelector('button')
                      
                      // Update button icon when paused
                      if (button) {
                        button.innerHTML = `
                          <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                          </svg>
                        `
                      }
                    }}
                  />
                </div>
              ) : msg.messageType === 'FILE' && msg.attachments && msg.attachments[0] ? (
                <a href={msg.attachments[0].fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 underline">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm break-all">{msg.attachments[0].fileName}</span>
                </a>
              ) : (
                <p className="text-sm break-words">{isDeleted ? 'This message was deleted' : msg.content}</p>
              )}

              {/* Actions trigger + menu (mobile long-press or click) */}
              {!isDeleted && (
                <button
                  className={`absolute ${isOwnMessage ? 'left-1' : 'right-1'} -top-6 text-gray-400 hover:text-gray-700 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId((prev) => (prev === msg.id ? null : msg.id)) }}
                  title="Menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
              {activeMenuId === msg.id && !isDeleted && (
                <div className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} -top-1 translate-y-[-100%] bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px] overflow-hidden`}
                  onMouseLeave={() => setActiveMenuId(null)}
                >
                  <button
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={async () => {
                      try {
                        await fetch(`/api/chat/conversations/${conversation.id}/messages/${msg.id}`, {
                          method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'me' })
                        })
                      } finally { setActiveMenuId(null) }
                    }}
                  >
                    Hapus untuk saya
                  </button>
                  {isOwnMessage && (
                    <button
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/chat/conversations/${conversation.id}/messages/${msg.id}`, {
                            method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'all' })
                          })
                          if (res.ok && socket) {
                            socket.emit('ack_message_deleted', { conversationId: conversation.id, messageId: msg.id, deletedBy: session?.user?.id })
                          }
                        } finally { setActiveMenuId(null) }
                      }}
                    >
                      Hapus untuk semua orang
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className={`flex items-center space-x-1 mt-1 ${
              isOwnMessage ? 'flex-row-reverse' : 'flex-row'
            }`}>
              <span className="text-xs text-gray-400">{messageTime}</span>
              {isOwnMessage && !isDeleted && (
                <div className="flex items-center space-x-1">
                  {/* Single check: sent, Double check: delivered, Blue double: read by all */}
                  <span className="text-xs text-gray-300">✓</span>
                  <span className={`text-xs ${(() => {
                    try {
                      const others = conversation.participants.filter(p => p.user.id !== session?.user?.id).map(p => p.user.id)
                      const readBy = (msg as any).readByUserIds as string[] | undefined
                      const allRead = readBy && others.every(id => readBy.includes(id))
                      return allRead ? 'text-blue-500' : 'text-gray-400'
                    } catch { return 'text-gray-400' }
                  })()}`}>✓</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleStickerSelect = (sticker: string) => {
    onSendMessage('', [{ fileName: sticker, fileUrl: sticker, fileSize: 0, fileType: 'image/png' } as any]);
    setShowStickerPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sendMessage = () => {
    if (!message.trim() && !isRecording) return;

    if (isRecording) {
      stopRecording();
      const blob = new Blob(recordChunksRef.current, { type: mediaRecorderRef.current.mimeType || 'audio/webm' });
      const fileName = `voice_${Date.now()}.${mediaRecorderRef.current.mimeType?.includes('ogg') ? 'ogg' : 'webm'}`;
      const file = new File([blob], fileName, { type: blob.type });
      const form = new FormData();
      form.append('file', file);

      try {
        fetch(`/api/chat/conversations/${conversation.id}/voice`, { method: 'POST', body: form })
          .then(res => res.json())
          .then(data => {
            if (data.file?.url) {
              onSendMessage('', [{ fileName: data.file.name, fileUrl: data.file.url, fileSize: data.file.size, fileType: data.file.type } as any]);
            }
          })
          .catch(error => {});
      } catch (error) {
      }
    } else {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === session?.user?.id
          const isAudioMessage = msg.messageType === 'AUDIO' && msg.attachments && msg.attachments[0]
          
          return (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                  isOwnMessage
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
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
                ) : msg.messageType === 'AUDIO' && msg.attachments && msg.attachments[0] ? (
                  // WhatsApp-style voice note UI
                  <div className="flex items-center space-x-3 min-w-[200px] max-w-[320px] p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Play/Pause Button */}
                    <button 
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                        isOwnMessage 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-2 border-blue-200' 
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 border-2 border-gray-300'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                        const button = e.currentTarget as HTMLButtonElement
                        if (audio) {
                          if (audio.paused) {
                            // Use AudioManager to play audio
                            audioManager.playAudio(audio, button)
                          } else {
                            // Use AudioManager to pause audio
                            audioManager.pauseAudio(audio, button)
                          }
                        }
                      }}
                    >
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Voice Note Content */}
                    <div className="flex-1">
                      {/* Duration Display - Show before playing */}
                      <div className="mb-2 text-center">
                        <span className={`text-sm font-semibold ${
                          isOwnMessage ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          <span className="total-duration-display">Loading...</span>
                  </span>
              </div>
                      
                      {/* Time Slider */}
                      <div className="mb-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value="0"
                          step="0.1"
                          className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, #e5e7eb 0%)`
                          }}
                          onChange={(e) => {
                            const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                            if (audio && audio.duration && isFinite(audio.duration)) {
                              const sliderValue = parseFloat(e.target.value)
                              if (isFinite(sliderValue) && sliderValue >= 0 && sliderValue <= 100) {
                                const seekTime = (sliderValue / 100) * audio.duration
                                if (isFinite(seekTime) && seekTime >= 0 && seekTime <= audio.duration) {
                                  audio.currentTime = seekTime
                                }
                              }
                            }
                          }}
                          onInput={(e) => {
                            const audio = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('audio') as HTMLAudioElement
                            if (audio && audio.duration && isFinite(audio.duration)) {
                              const sliderValue = parseFloat(e.currentTarget.value)
                              if (isFinite(sliderValue) && sliderValue >= 0 && sliderValue <= 100) {
                                const currentTime = (sliderValue / 100) * audio.duration
                                if (isFinite(currentTime) && currentTime >= 0) {
                                  const minutes = Math.floor(currentTime / 60)
                                  const seconds = Math.floor(currentTime % 60)
                                  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                                  
                                  // Update the current time display
                                  const currentTimeSpan = e.currentTarget.parentElement?.parentElement?.querySelector('.current-time')
                                  if (currentTimeSpan) {
                                    currentTimeSpan.textContent = timeString
                                  }
                                }
                              }
                            }
                          }}
                        />
                        <style jsx>{`
                          .slider::-webkit-slider-thumb {
                            appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: ${isOwnMessage ? '#3b82f6' : '#6b7280'};
                            cursor: pointer;
                            border: 3px solid white;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                            transition: all 0.2s ease;
                          }
                          .slider::-webkit-slider-thumb:hover {
                            transform: scale(1.1);
                            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                          }
                          .slider::-moz-range-thumb {
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: ${isOwnMessage ? '#3b82f6' : '#6b7280'};
                            cursor: pointer;
                            border: 3px solid white;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                          }
                          .slider:focus {
                            outline: none;
                          }
                        `}</style>
            </div>
                      
                      {/* Progress and File Info */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${
                          isOwnMessage ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          <span className="current-time">0:00</span> / <span className="total-duration">0:00</span>
                        </span>
                        <span className={`${
                          isOwnMessage ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {msg.attachments[0].fileName.includes('webm') ? 'Voice Message' : 'Audio'}
                        </span>
          </div>
        </div>

                    {/* Hidden audio element for actual playback */}
                    <audio 
                      className="hidden" 
                      src={msg.attachments[0].fileUrl} 
                      onLoadedMetadata={(e) => {
                        const audio = e.currentTarget
                        const button = audio.parentElement?.querySelector('button')
                        const slider = audio.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
                        if (button && audio.duration && isFinite(audio.duration) && slider) {
                          const duration = Math.round(audio.duration)
                          if (isFinite(duration) && duration > 0) {
                            const minutes = Math.floor(duration / 60)
                            const seconds = duration % 60
                            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                            
                            // Set slider max value
                            slider.setAttribute('max', '100')
                            
                            // Update the total duration display
                            const totalDurationSpan = button.parentElement?.parentElement?.querySelector('.total-duration')
                            if (totalDurationSpan) {
                              totalDurationSpan.textContent = timeString
                            }
                            
                            // Update the duration display above slider
                            const totalDurationDisplay = button.parentElement?.parentElement?.querySelector('.total-duration-display')
                            if (totalDurationDisplay) {
                              totalDurationDisplay.textContent = timeString
                            }
                          }
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const audio = e.currentTarget
                        const slider = audio.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
                        const button = audio.parentElement?.querySelector('button')
                        
                        if (slider && audio.duration && isFinite(audio.duration) && isFinite(audio.currentTime)) {
                          const progress = (audio.currentTime / audio.duration) * 100
                          if (isFinite(progress) && progress >= 0 && progress <= 100) {
                            slider.value = progress.toString()
                            
                            // Update slider background
                            slider.style.background = `linear-gradient(to right, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, ${isOwnMessage ? '#3b82f6' : '#6b7280'} ${progress}%, #e5e7eb ${progress}%)`
                          }
                        }
                        
                        // Update current time display
                        if (button && isFinite(audio.currentTime)) {
                          const currentMinutes = Math.floor(audio.currentTime / 60)
                          const currentSeconds = Math.floor(audio.currentTime % 60)
                          const currentTimeString = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`
                          
                          const currentTimeSpan = button.parentElement?.parentElement?.querySelector('.current-time')
                          if (currentTimeSpan) {
                            currentTimeSpan.textContent = currentTimeString
                          }
                        }
                      }}
                      onEnded={(e) => {
                        const audio = e.currentTarget
                        const button = audio.parentElement?.querySelector('button')
                        const slider = audio.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
                        
                        // Reset button icon
                        if (button) {
                          button.innerHTML = `
                            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                            </svg>
                          `
                        }
                        
                        // Reset slider
                        if (slider) {
                          slider.value = '0'
                          slider.style.background = `linear-gradient(to right, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, ${isOwnMessage ? '#3b82f6' : '#6b7280'} 0%, #e5e7eb 0%)`
                        }
                        
                        // Reset time display
                        const currentTimeSpan = button?.parentElement?.parentElement?.querySelector('.current-time')
                        if (currentTimeSpan) {
                          currentTimeSpan.textContent = '0:00'
                        }
                        
                        // Clear from AudioManager
                        audioManager.stopAll()
                      }}
                      onPause={(e) => {
                        const audio = e.currentTarget
                        const button = audio.parentElement?.querySelector('button')
                        
                        // Update button icon when paused
                        if (button) {
                          button.innerHTML = `
                            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                            </svg>
                          `
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="break-words">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                )}
                
                {/* Message Time */}
                <div className={`text-xs mt-2 ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
            </div>
          )
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
                <span className="text-xs text-gray-500 ml-2">{getTypingLabel()}</span>
          </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-end space-x-3">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Emoji"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zM7 8a1 1 0 00-1 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm7 0a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Sticker Button */}
          <button
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Sticker"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* File Upload Button */}
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Attach File"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Voice Recording Button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={cancelRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-3 rounded-full transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 text-white scale-110 shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isRecording ? 'Release to send' : 'Hold to record'}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!message.trim() && !isRecording}
            className={`p-3 rounded-full transition-all duration-200 ${
              message.trim() || isRecording
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Recording Status */}
              {isRecording && (
          <div className="mt-3 flex items-center justify-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Recording {formatTime(recordMs)}
              </span>
                </div>
            <button
              onClick={cancelRecording}
              className="px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
            </div>
        )}

        {/* Hidden file input */}
        <input
          id="fileInput"
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
            </div>
            
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
      )}
        
      {/* Sticker Picker */}
      {showStickerPicker && (
        <div className="absolute bottom-20 left-4 z-50">
          <StickerPicker onStickerSelect={handleStickerSelect} />
      </div>
      )}
    </div>
  )
}
