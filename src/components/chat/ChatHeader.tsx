'use client';

import React from 'react';
import { Plus, Search, Circle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/input-component';
import { Badge } from '@/components/ui/Badge';

interface ChatHeaderProps {
  onNewChat: () => void;
  onSearch: (query: string) => void;
  totalUnread?: number;
  isMobile?: boolean;
}

export default function ChatHeader({ onNewChat, onSearch, totalUnread, isMobile = false }: ChatHeaderProps) {
  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-white to-gray-50 dark:from-slate-800 dark:to-slate-700`}>
      <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center`}>
              <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>Messages</h2>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full`}>
              <Circle className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} text-green-500 mr-1`} />
              <span className={isMobile ? 'hidden sm:inline' : ''}>Online</span>
            </span>
            {totalUnread && totalUnread > 0 && (
              <Badge variant="danger" className={`${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} font-semibold animate-pulse`}>
                {totalUnread}
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={onNewChat}
          size={isMobile ? "sm" : "sm"}
          className={`${isMobile ? 'px-3 py-2' : 'px-4 py-2'} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
        >
          <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1 sm:mr-2`} />
          <span className={isMobile ? 'hidden sm:inline' : ''}>New Chat</span>
        </Button>
      </div>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <Input
          placeholder="Search conversations..."
          className={`${isMobile ? 'pl-10 text-sm' : 'pl-12'} bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 dark:focus:border-blue-400 dark:text-slate-100 dark:placeholder-gray-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200`}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
