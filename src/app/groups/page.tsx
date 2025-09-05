'use client'

import { useState, useEffect } from 'react'
import { useGroups } from '@/lib/hooks/useGroups'
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages'
import { getCurrentUser } from '@/lib/auth-client'
import GroupList from '@/components/groups/GroupList'
import MessageList from '@/components/groups/MessageList'
import MessageInput from '@/components/groups/MessageInput'

export default function GroupsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { groups, loading: groupsLoading, error: groupsError } = useGroups()
  const { messages, loading: messagesLoading, error: messagesError, sendMessage } = useRealtimeMessages(selectedGroupId)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { user } = await getCurrentUser()
      setCurrentUserId(user?.id || null)
    }
    fetchCurrentUser()
  }, [])

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
  }

  const handleSendMessage = async (message: string) => {
    return await sendMessage(message)
  }

  if (groupsError || messagesError) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <h1 className="text-2xl font-bold text-white mb-4">Groups</h1>
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
            <p className="text-red-300">
              {groupsError || messagesError}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-4">Groups</h1>
        <p className="text-gray-300">
          Participate in group chats and collaborate with other program participants.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-12rem)] animate-slide-in">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <GroupList
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={handleSelectGroup}
            loading={groupsLoading}
          />
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col h-full">
          {selectedGroupId ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Messages */}
              <div className="flex-1 min-h-0">
                <MessageList
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={currentUserId}
                />
              </div>

              {/* Message Input */}
              <div className="flex-shrink-0">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={!currentUserId}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
              <div className="flex items-center justify-center h-full">
                <div className="text-center animate-fade-in">
                  <div className="text-4xl sm:text-6xl mb-4 animate-bounce">💬</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Select a Group
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Choose a group from the list to start chatting
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}