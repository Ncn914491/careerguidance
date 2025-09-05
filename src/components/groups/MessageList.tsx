'use client'

import { useEffect, useRef } from 'react'
import { Database } from '@/lib/supabase'

type Message = Database['public']['Tables']['group_messages']['Row'] & {
  profiles: {
    full_name: string | null
    email: string
  } | null
}

interface MessageListProps {
  messages: Message[]
  loading: boolean
  currentUserId?: string | null
}

export default function MessageList({ messages, loading, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 bg-glass backdrop-blur-md rounded-xl p-4 border border-glass shadow-glass">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 bg-glass backdrop-blur-md rounded-xl p-4 border border-glass shadow-glass">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-300">No messages yet. Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId
          const senderName = message.profiles?.full_name || message.profiles?.email || 'Unknown User'
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                    : 'bg-glass border border-glass text-white'
                }`}
              >
                {!isOwnMessage && (
                  <div className="text-xs text-gray-300 mb-1 font-medium">
                    {senderName}
                  </div>
                )}
                <div className="break-words">{message.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}