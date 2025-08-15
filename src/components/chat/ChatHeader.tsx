'use client';

import React from 'react';
import { Plus, Search, Circle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Badge from '@/components/ui/Badge';

interface ChatHeaderProps {
  onNewChat: () => void;
  onSearch: (query: string) => void;
  totalUnread?: number;
}

export default function ChatHeader({ onNewChat, onSearch, totalUnread }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <span className="flex items-center text-xs text-gray-500">
            <Circle className="w-3 h-3 text-green-500 mr-1" /> Online
          </span>
          {totalUnread && totalUnread > 0 && (
            <Badge variant="danger" className="px-2 py-0.5 text-xs">{totalUnread}</Badge>
          )}
        </div>
        <Button
          onClick={onNewChat}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search conversations..."
          className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
