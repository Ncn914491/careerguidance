'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { PaperAirplaneIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

interface ChatMessage {
  id: string
  message: string
  response: string
  created_at: string
  isUser?: boolean
  text?: string
}

export default function AIChatPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, isInitialized, router])

  // Load chat history
  useEffect(() => {
    if (user && isInitialized) {
      loadChatHistory()
    }
  }, [user, isInitialized])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true)
      
      const data = await api.get('/api/ai-chat')
      
      if (data.error) {
        console.warn('Failed to load chat history:', data.error)
        return
      }

      // Convert chat history to message format
      const chatMessages: ChatMessage[] = []
      data.chats?.forEach((chat: { message: string; response: string; created_at: string }) => {
        chatMessages.push({
          id: `${chat.created_at}-user`,
          message: chat.message,
          response: '',
          created_at: chat.created_at,
          isUser: true,
          text: chat.message
        })
        chatMessages.push({
          id: `${chat.created_at}-ai`,
          message: '',
          response: chat.response,
          created_at: chat.created_at,
          isUser: false,
          text: chat.response
        })
      })
      
      setMessages(chatMessages)
    } catch (err) {
      console.error('Error loading chat history:', err)
      // Don't show error for history loading failure
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setError(null)

    // Add user message to chat
    const userMessageObj: ChatMessage = {
      id: `user-${Date.now()}`,
      message: userMessage,
      response: '',
      created_at: new Date().toISOString(),
      isUser: true,
      text: userMessage
    }

    setMessages(prev => [...prev, userMessageObj])
    setIsLoading(true)

    try {
      const data = await api.post('/api/ai-chat', { message: userMessage })

      if (data.error) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      // Add AI response to chat
      const aiMessageObj: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: '',
        response: data.response,
        created_at: data.timestamp,
        isUser: false,
        text: data.response
      }

      setMessages(prev => [...prev, aiMessageObj])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      
      // Add error message to chat
      const errorMessageObj: ChatMessage = {
        id: `error-${Date.now()}`,
        message: '',
        response: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
        isUser: false,
        text: 'Sorry, I encountered an error. Please try again.'
      }

      setMessages(prev => [...prev, errorMessageObj])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Show loading while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-gray-300 text-sm">Initializing...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-glass bg-glass-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Career Assistant</h2>
              <p className="text-xs text-gray-300">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            title="Clear Chat"
          >
            <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-gray-300 text-sm">Loading chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to AI Career Assistant</h3>
              <p className="text-gray-300 max-w-md">
                Ask me anything about career guidance, job opportunities, resume tips, interview preparation, or educational planning!
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-400">Try asking:</p>
                <div className="space-y-1 text-sm text-blue-300">
                  <p>&quot;What career paths are good for computer science?&quot;</p>
                  <p>&quot;How do I prepare for a job interview?&quot;</p>
                  <p>&quot;What skills should I develop for my career?&quot;</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-glass border border-glass text-white'
                }`}
              >
                {!message.isUser && (
                  <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-300 font-medium">AI Assistant</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {message.text}
                </div>
                <div className="text-xs text-gray-300 mt-2 opacity-70">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-glass border border-glass rounded-lg px-4 py-3 max-w-xs">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300 font-medium">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 border-t border-red-400/50">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-glass bg-glass-dark">
        <div className="flex gap-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about career guidance, job opportunities, or anything else..."
            disabled={isLoading}
            className="flex-1 bg-glass border border-glass rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 min-h-[2.5rem] max-h-24"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed self-end transform hover:scale-105 active:scale-95 min-w-[4rem]"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}