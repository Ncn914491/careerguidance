import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { type GroupMessageWithProfile } from '@/types/database'
import { api } from '@/lib/api'

type Message = GroupMessageWithProfile

export function useRealtimeMessages(groupId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!groupId) return

    setLoading(true)
    try {
      const data = await api.get(`/api/groups/${groupId}/messages`)
      if (data.error) {
        if (data.status === 401) {
          setError('Please log in to view messages')
        } else if (data.status === 403) {
          setError('You need to join this group to view messages')
        } else {
          setError(data.error || 'Failed to load messages')
        }
        return
      }
      setMessages(data.messages || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    fetchMessages()

    if (!groupId) {
      setMessages([])
      setLoading(false)
      return
    }

    const channel = supabase.channel(`group-channel:${groupId}`)

    channel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, fetchMessages])

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!groupId || !content.trim()) return false

    try {
      const data = await api.post(`/api/groups/${groupId}/messages`, {
        message: content.trim()
      })

      if (data.error) {
        setError(data.error || 'Failed to send message')
        return false
      }
      return true
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
      return false
    }
  }

  return { messages, loading, error, sendMessage, refetch: fetchMessages }
}
