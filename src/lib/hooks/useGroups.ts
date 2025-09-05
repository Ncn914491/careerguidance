'use client'

import { useEffect, useState } from 'react'
import { Database } from '@/lib/supabase'

type Group = Database['public']['Tables']['groups']['Row']

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups')
        if (!response.ok) {
          throw new Error('Failed to fetch groups')
        }
        const data = await response.json()
        setGroups(data.groups || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching groups:', err)
        setError('Failed to load groups')
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  const createGroup = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) {
        throw new Error('Failed to create group')
      }

      const data = await response.json()
      setGroups(prev => [...prev, data.group])
      setError(null)
      return data.group
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Failed to create group')
      return null
    }
  }

  return {
    groups,
    loading,
    error,
    createGroup
  }
}