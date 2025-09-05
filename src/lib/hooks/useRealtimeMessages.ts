'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Message = Database['public']['Tables']['group_messages']['Row'] & {
  profiles: {
    full_name: string | null
    email: string
  } | null
}

export function useRealtimeMessages(groupId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) {
      setMessages([])
      setLoading(false)
      return
    }

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/messages`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Messages API error:', response.status, errorData)
          
          if (response.status === 401) {
            setError('Please log in to view messages')
          } else if (response.status === 403) {
            setError('You need to join this group to view messages')
          } else {
            setError(errorData.error || 'Failed to load messages')
          }
          return
        }
        const data = await response.json()
        setMessages(data.messages || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Set up real-time subscription
    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch the complete message with profile information
          const { data: newMessage, error } = await supabase
            .from('group_messages')
            .select(`
              *,
              profiles:sender_id (
                full_name,
                email
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && newMessage) {
            setMessages(prev => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!groupId || !message.trim()) return false

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Message will be added via real-time subscription
      return true
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
      return false
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage
  }
}