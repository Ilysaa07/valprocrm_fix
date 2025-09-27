'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, Search, Users, User, Check, MessageCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/input-component';
// Using simple avatar logic (img or initial) inline to avoid broken Avatar component
import { Badge } from '@/components/ui/Badge';

interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  role: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: unknown) => void;
  isMobile?: boolean;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
  isMobile = false,
}: NewConversationModalProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [conversationType, setConversationType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/users?q=${searchQuery}&excludeCurrent=true`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  

  const handleUserSelect = (user: User) => {
    if (conversationType === 'DIRECT') {
      setSelectedUsers([user]);
    } else {
      setSelectedUsers(prev => {
        const isSelected = prev.find(u => u.id === user.id);
        if (isSelected) {
          return prev.filter(u => u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    if (conversationType === 'GROUP' && !groupName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: selectedUsers.map(u => u.id),
          name: conversationType === 'GROUP' ? groupName : undefined,
          type: conversationType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onConversationCreated(data.conversation);
        onClose();
        resetForm();
      } else {
        let errText = 'Failed to create conversation';
        try {
          const err = await response.json();
          errText = err?.error || errText;
          if (err?.details?.participantIds) {
            errText += `: ${err.details.participantIds.join(', ')}`;
          }
        } catch {}
        setError(errText);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedUsers([]);
    setConversationType('DIRECT');
    setGroupName('');
  };

  

  const filteredUsers = users.filter(user => 
    user.id !== session?.user?.id && 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserSelected = (user: User) => {
    return selectedUsers.some(u => u.id === user.id);
  };

  const canCreateConversation = () => {
    if (selectedUsers.length === 0) return false;
    if (conversationType === 'GROUP' && !groupName.trim()) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="New Conversation" 
      className={`bg-white dark:bg-gray-800 ${isMobile ? 'max-w-full mx-4' : ''}`}
    >
      <div className={`space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 ${isMobile ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span>{error}</span>
            </div>
          </div>
        )}
        {/* Conversation Type Selection */}
        <div className={`space-y-3 sm:space-y-4 bg-white dark:bg-gray-800 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>Conversation Type</h3>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 sm:gap-4`}>
            <button
              onClick={() => {
                setConversationType('DIRECT');
                setSelectedUsers([]);
              }}
              className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                conversationType === 'DIRECT'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg ring-1 ring-blue-200/50 dark:ring-blue-800/30'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  conversationType === 'DIRECT' ? 'bg-blue-500' : 'bg-gray-100 dark:bg-neutral-700'
                }`}>
                  <User className={`w-5 h-5 ${
                    conversationType === 'DIRECT' ? 'text-white' : 'text-gray-600 dark:text-neutral-300'
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${
                    conversationType === 'DIRECT' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-neutral-100'
                  }`}>
                    Direct Message
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Chat with one person</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setConversationType('GROUP');
                setSelectedUsers([]);
              }}
              className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                conversationType === 'GROUP'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg ring-1 ring-blue-200/50 dark:ring-blue-800/30'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  conversationType === 'GROUP' ? 'bg-blue-500' : 'bg-gray-100 dark:bg-neutral-700'
                }`}>
                  <Users className={`w-5 h-5 ${
                    conversationType === 'GROUP' ? 'text-white' : 'text-gray-600 dark:text-neutral-300'
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${
                    conversationType === 'GROUP' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-neutral-100'
                  }`}>
                    Group Chat
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Chat with multiple people</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Group Name Input */}
        {conversationType === 'GROUP' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-neutral-100">Group Name</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="border-gray-200 dark:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-400"
            />
          </div>
        )}

        {/* User Search */}
        <div className={`space-y-3 sm:space-y-4 bg-white dark:bg-gray-800 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
          <label className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
            {conversationType === 'DIRECT' ? 'Select User' : 'Select Users'}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-12 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-gray-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-neutral-100">Selected Users</label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="default" className="flex items-center space-x-1">
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {user.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span>{user.fullName}</span>
                  <button
                    onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className={`space-y-2 ${isMobile ? 'max-h-40' : 'max-h-60'} overflow-y-auto bg-white dark:bg-gray-800 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center space-x-3 ${isMobile ? 'p-3' : 'p-4'} rounded-xl cursor-pointer transition-all duration-200 ${
                  isUserSelected(user)
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 shadow-md ring-1 ring-blue-200/50 dark:ring-blue-800/30'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700 border border-transparent hover:shadow-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-gray-700 dark:text-neutral-300">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none'
                        const next = e.currentTarget.nextElementSibling as HTMLElement | null
                        if (next) next.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <span className={user.profilePicture ? 'hidden' : ''}>
                    {user.fullName.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isUserSelected(user) ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-neutral-100'
                  }`}>
                    {user.fullName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">{user.email}</p>
                </div>
                
                {isUserSelected(user) && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} ${isMobile ? 'pt-4' : 'pt-6'} border-t border-gray-200 dark:border-slate-700`}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={`${isMobile ? 'w-full' : 'px-6 py-2'} rounded-xl border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={!canCreateConversation() || isLoading}
            className={`${isMobile ? 'w-full' : 'px-6 py-2'} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </div>
            ) : (
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Create Conversation
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
