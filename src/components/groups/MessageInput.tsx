'use client'

import { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<boolean>
  disabled?: boolean
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return

    setSending(true)
    const success = await onSendMessage(message)
    if (success) {
      setMessage('')
    }
    setSending(false)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-glass backdrop-blur-md rounded-xl p-4 border border-glass shadow-glass">
      <div className="flex space-x-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          disabled={disabled || sending}
          className="flex-1 bg-glass border border-glass rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50"
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className="px-6 py-2 bg-blue-500/30 border border-blue-400/50 text-white rounded-lg hover:bg-blue-500/40 hover:shadow-glass-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed self-end transform hover:scale-105 active:scale-95"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  )
}