'use client'

import { useState, useEffect } from 'react'
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { UserGroupIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface Group {
  id: string
  name: string
  description: string
  member_count: number
  is_member: boolean
  created_at: string
}

interface GroupChatAreaProps {
  group: Group | null
  currentUserId?: string
  isAdmin?: boolean
}

export default function GroupChatArea({ group, currentUserId, isAdmin = false }: GroupChatAreaProps) {
  const { messages, loading: messagesLoading, error: messagesError, sendMessage } = useRealtimeMessages(group?.id || null)
  const [showInfo, setShowInfo] = useState(false)

  const handleSendMessage = async (message: string) => {
    return await sendMessage(message)
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-glass backdrop-blur-md">
        <div className="text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to Groups</h3>
          <p className="text-gray-300 max-w-md">
            Select a group from the sidebar to start chatting, or join a new group to connect with others.
          </p>
        </div>
      </div>
    )
  }

  if (!group.is_member) {
    return (
      <div className="flex-1 flex items-center justify-center bg-glass backdrop-blur-md">
        <div className="text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Join Group to Chat</h3>
          <p className="text-gray-300 max-w-md">
            You need to join "{group.name}" to participate in the conversation.
          </p>
        </div>
      </div>
    )
  }

  if (messagesError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-glass backdrop-blur-md">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-red-300 mb-2">Error Loading Messages</h3>
            <p className="text-red-300">{messagesError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-glass backdrop-blur-md">
      {/* Chat Header */}
      <div className="p-4 border-b border-glass bg-glass-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{group.name}</h2>
              <p className="text-xs text-gray-300">
                {group.member_count} member{group.member_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            title="Group Info"
          >
            <InformationCircleIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Group Info Panel */}
        {showInfo && (
          <div className="mt-4 p-3 bg-glass rounded-lg border border-glass">
            <h4 className="font-medium text-white mb-2">About this group</h4>
            <p className="text-sm text-gray-300 mb-2">
              {group.description || 'No description available'}
            </p>
            <p className="text-xs text-gray-400">
              Created {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <MessageList
            messages={messages}
            loading={messagesLoading}
            currentUserId={currentUserId}
          />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t border-glass">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!currentUserId}
            placeholder={`Message ${group.name}...`}
          />
        </div>
      </div>
    </div>
  )
}