'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, ChatBubbleLeftRightIcon, PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import { useGroups } from '@/hooks/useSupabaseQuery';
import { api } from '@/lib/api';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_member: boolean;
  created_at: string;
}

export function ViewGroups() {
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const { data: groups = [], error, isLoading, mutate } = useGroups();
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Don't show error immediately if auth is still loading
  useEffect(() => {
    if (error && !message && isInitialized && !authLoading) {
      setMessage({ 
        type: 'error', 
        text: user ? 'Failed to load groups' : 'Please log in to view groups' 
      });
    }
  }, [error, message, authLoading, isInitialized, user]);

  // Show loading if auth is still loading
  if (!isInitialized || authLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-glass rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-glass rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8 text-center">
          <h4 className="text-xl font-semibold text-white mb-2">Authentication Required</h4>
          <p className="text-gray-300">Please log in to view and join study groups.</p>
        </div>
      </div>
    );
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    
    setJoiningGroup(groupId);
    try {
      const data = await api.post(`/api/groups/${groupId}/join`, {});

      if (data.error) {
        setMessage({ type: 'error', text: data.error || 'Failed to join group' });
      } else {
        setMessage({ type: 'success', text: 'Successfully joined the group!' });
        mutate(); // Refresh the groups list
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setMessage({ type: 'error', text: 'Failed to join group' });
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user || !confirm('Are you sure you want to leave this group?')) return;
    
    setJoiningGroup(groupId);
    try {
      const data = await api.post(`/api/groups/${groupId}/leave`, {});

      if (data.error) {
        setMessage({ type: 'error', text: data.error || 'Failed to leave group' });
      } else {
        setMessage({ type: 'success', text: 'Successfully left the group' });
        mutate(); // Refresh the groups list
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setMessage({ type: 'error', text: 'Failed to leave group' });
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleOpenChat = (groupId: string) => {
    // Navigate to group chat
    window.location.href = `/groups/${groupId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-glass rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-glass rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myGroups = groups.filter((group: Group) => group.is_member);
  const availableGroups = groups.filter((group: Group) => !group.is_member);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Study Groups</h2>
        <p className="text-gray-300">Join groups to discuss topics and collaborate with other students.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border backdrop-blur-md transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-300 border-green-400/50' 
            : 'bg-red-500/20 text-red-300 border-red-400/50'
        }`}>
          {message.text}
        </div>
      )}

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-400" />
            My Groups ({myGroups.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myGroups.map((group: Group) => (
              <div key={group.id} className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 hover:bg-glass-light transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">{group.name}</h4>
                    <p className="text-gray-300 text-sm mb-3">{group.description}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <UsersIcon className="w-4 h-4" />
                      <span>{group.member_count} members</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenChat(group.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Open Chat
                  </button>
                  <button
                    onClick={() => handleLeaveGroup(group.id)}
                    disabled={joiningGroup === group.id}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-400/50 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {joiningGroup === group.id ? 'Leaving...' : 'Leave'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Groups */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-green-400" />
          Available Groups ({availableGroups.length})
        </h3>
        
        {availableGroups.length === 0 ? (
          <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">
              {myGroups.length > 0 ? 'No More Groups Available' : 'No Groups Available'}
            </h4>
            <p className="text-gray-300">
              {myGroups.length > 0 
                ? 'You\'ve joined all available groups! Check back later for new groups.'
                : 'There are no study groups available at the moment. Check back later!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableGroups.map((group: Group) => (
              <div key={group.id} className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 hover:bg-glass-light transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">{group.name}</h4>
                    <p className="text-gray-300 text-sm mb-3">{group.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{group.member_count} members</span>
                      </div>
                      <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleJoinGroup(group.id)}
                  disabled={joiningGroup === group.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  <PlusIcon className="w-4 h-4" />
                  {joiningGroup === group.id ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}