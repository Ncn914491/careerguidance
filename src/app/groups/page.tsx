'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import GroupsSidebar from '@/components/groups/GroupsSidebar'
import GroupChatArea from '@/components/groups/GroupChatArea'
import { api } from '@/lib/api'
import { useAuthenticatedAPI } from '@/hooks/useSupabaseData'

interface Group {
  id: string
  name: string
  description: string
  member_count: number
  is_member: boolean
  created_at: string
}

interface GroupsResponse {
  groups: Group[];
}

export default function GroupsPage() {
  const router = useRouter()
  const { user, isAdmin, isLoading: authLoading, isInitialized } = useAuth()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  
  // Use the new data fetching hook
  const { data: groupsData, loading, error, refetch } = useAuthenticatedAPI<GroupsResponse>('/api/groups')
  const groups = groupsData?.groups || []

  // Redirect to login if not authenticated and auth is initialized
  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, isInitialized, router])

  // Refetch groups when needed
  const refetchGroups = () => {
    refetch();
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      console.log('Attempting to join group:', groupId)
      
      const data = await api.post(`/api/groups/${groupId}/join`, {})
      console.log('Join group response:', data)

      if (data.error) {
        throw new Error(data.error)
      }

      // Refetch groups to get updated data
      refetchGroups()
      
      // Automatically select the joined group
      setSelectedGroupId(groupId)

      console.log('Successfully joined group:', data.message)
    } catch (err) {
      console.error('Error joining group:', err)
      alert('Failed to join group: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      const data = await api.post('/api/groups', { name, description })

      if (data.error) {
        throw new Error(data.error)
      }

      // Refetch groups to get updated data
      refetchGroups()
      setSelectedGroupId(data.group.id)
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
            onClick={refetchGroups}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const selectedGroup: Group | null = selectedGroupId ? groups.find(g => g.id === selectedGroupId) || null : null

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
        isAdmin={isAdmin}
      />

      {/* Chat Area */}
      <GroupChatArea
        group={selectedGroup}
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}