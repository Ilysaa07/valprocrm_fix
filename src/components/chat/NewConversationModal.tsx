'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Search, Users, User, Check, MessageCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Badge from '@/components/ui/Badge';

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
  onConversationCreated: (conversation: any) => void;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [conversationType, setConversationType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, searchQuery]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/chat/users?q=${searchQuery}&excludeCurrent=true`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
        } catch (_) {}
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

  const handleClose = () => {
    resetForm();
    onClose();
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
    <Modal isOpen={isOpen} onClose={onClose} title="New Conversation">
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {/* Conversation Type Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Conversation Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setConversationType('DIRECT');
                setSelectedUsers([]);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                conversationType === 'DIRECT'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  conversationType === 'DIRECT' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <User className={`w-5 h-5 ${
                    conversationType === 'DIRECT' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${
                    conversationType === 'DIRECT' ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    Direct Message
                  </p>
                  <p className="text-sm text-gray-500">Chat with one person</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setConversationType('GROUP');
                setSelectedUsers([]);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                conversationType === 'GROUP'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  conversationType === 'GROUP' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <Users className={`w-5 h-5 ${
                    conversationType === 'GROUP' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${
                    conversationType === 'GROUP' ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    Group Chat
                  </p>
                  <p className="text-sm text-gray-500">Chat with multiple people</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Group Name Input */}
        {conversationType === 'GROUP' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Group Name</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="border-gray-200 focus:border-blue-500"
            />
          </div>
        )}

        {/* User Search */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900">
            {conversationType === 'DIRECT' ? 'Select User' : 'Select Users'}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 border-gray-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Selected Users</label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="default" className="flex items-center space-x-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={user.profilePicture} alt={user.fullName} />
                    <AvatarFallback className="text-xs">
                      {user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
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
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isUserSelected(user)
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.profilePicture} alt={user.fullName} />
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isUserSelected(user) ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {user.fullName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
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
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={!canCreateConversation() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Create Conversation
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
