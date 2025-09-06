'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages';
import MessageList from '@/components/groups/MessageList';
import MessageInput from '@/components/groups/MessageInput';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { messages, loading: messagesLoading, error: messagesError, sendMessage } = useRealtimeMessages(groupId);

  // Redirect to login if not authenticated and auth is initialized
  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, isInitialized, router]);

  // Fetch group details
  useEffect(() => {
    if (!user || !groupId) return;

    const fetchGroup = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/groups/${groupId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch group');
        }

        setGroup(data.group);
      } catch (err) {
        console.error('Error fetching group:', err);
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [user, groupId]);

  const handleSendMessage = async (message: string) => {
    return await sendMessage(message);
  };

  const handleBackToGroups = () => {
    router.push('/groups');
  };

  // Show loading while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || messagesError) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToGroups}
              className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Group Chat</h1>
          </div>
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
            <p className="text-red-300">
              {error || messagesError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToGroups}
              className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Group Not Found</h1>
          </div>
          <p className="text-gray-300">The requested group could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToGroups}
            className="p-2 hover:bg-glass-light rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            {group.description && (
              <p className="text-gray-300 mt-1">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col h-full space-y-4">
        {/* Messages */}
        <div className="flex-1 min-h-0">
          <MessageList
            messages={messages}
            loading={messagesLoading}
            currentUserId={user.id}
          />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!user}
          />
        </div>
      </div>
    </div>
  );
}