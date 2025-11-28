'use client'

import { useEffect, useRef } from 'react'
import { GroupMessageWithProfile } from '@/types/database'

type Message = GroupMessageWithProfile

interface MessageListProps {
  messages: Message[]
  loading: boolean
  currentUserId?: string | null
}

export default function MessageList({ messages, loading, currentUserId }: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-300">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden chat-messages-container"
    >
      <div className="p-4 flex flex-col gap-3">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId
          const senderName = message.profiles?.full_name || 'Unknown User'
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} message-bubble`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[65%] lg:max-w-md px-4 py-2 rounded-2xl shadow-sm flex-shrink-0 ${
                  isOwnMessage
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-glass-dark border border-glass text-white rounded-bl-md'
                }`}
              >
                {!isOwnMessage && (
                  <div className="text-xs text-purple-300 mb-1 font-medium">
                    {senderName}
                  </div>
                )}
                <div className="break-words text-sm leading-relaxed whitespace-pre-wrap">{message.message}</div>
                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  )
}