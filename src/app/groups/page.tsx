'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import GroupsSidebar from '@/components/groups/GroupsSidebar'
import GroupChatArea from '@/components/groups/GroupChatArea'

interface Group {
  id: string
  name: string
  description: string
  member_count: number
  is_member: boolean
  created_at: string
}

export default function GroupsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated and auth is initialized
  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, isInitialized, router])

  // Fetch groups
  useEffect(() => {
    if (!user) return

    const fetchGroups = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/groups', {
          credentials: 'include'
        })
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
  }, [user])

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      console.log('Attempting to join group:', groupId)
      
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      const data = await response.json()
      console.log('Join group response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group')
      }

      // Update local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, is_member: true, member_count: group.member_count + 1 }
          : group
      ))

      console.log('Successfully joined group:', data.message)
    } catch (err) {
      console.error('Error joining group:', err)
      alert('Failed to join group: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCreateGroup = async (name: string, description: string) => {
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
      const newGroup = {
        ...data.group,
        member_count: 1,
        is_member: true
      }
      
      setGroups(prev => [newGroup, ...prev])
      setSelectedGroupId(newGroup.id)
    } catch (err) {
      console.error('Error creating group:', err)
      // You could show a toast notification here
    }
  }

  // Show loading while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-6 max-w-md text-center">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Error Loading Groups</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass overflow-hidden">
      {/* Sidebar */}
      <GroupsSidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleSelectGroup}
        onJoinGroup={handleJoinGroup}
        onCreateGroup={handleCreateGroup}
        loading={loading}
        currentUserId={user?.id}
      />

      {/* Chat Area */}
      <GroupChatArea
        group={selectedGroup}
        currentUserId={user?.id}
      />
    </div>
  )
}