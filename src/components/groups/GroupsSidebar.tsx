'use client'

import { useState } from 'react'
import { PlusIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Group {
  id: string
  name: string
  description: string
  member_count: number
  is_member: boolean
  created_at: string
}

interface GroupsSidebarProps {
  groups: Group[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  onJoinGroup: (groupId: string) => void
  onCreateGroup: (name: string, description: string) => void
  loading: boolean
  currentUserId?: string
}

export default function GroupsSidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  onJoinGroup,
  onCreateGroup,
  loading,
  currentUserId
}: GroupsSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const joinedGroups = groups.filter(g => g.is_member)
  const availableGroups = groups.filter(g => !g.is_member)

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || creating) return

    setCreating(true)
    await onCreateGroup(newGroupName.trim(), newGroupDescription.trim())
    setNewGroupName('')
    setNewGroupDescription('')
    setShowCreateForm(false)
    setCreating(false)
  }

  const handleJoinGroup = async (groupId: string) => {
    await onJoinGroup(groupId)
  }

  if (loading) {
    return (
      <div className="w-80 bg-glass backdrop-blur-md border-r border-glass h-full flex flex-col">
        <div className="p-4 border-b border-glass">
          <div className="h-6 bg-glass rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-glass rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-glass backdrop-blur-md border-r border-glass h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-glass">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Groups
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            title="Create Group"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-glass bg-glass-dark">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-glass border border-glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              maxLength={50}
            />
            <textarea
              placeholder="Description (optional)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="w-full px-3 py-2 bg-glass border border-glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              rows={2}
              maxLength={200}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creating}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewGroupName('')
                  setNewGroupDescription('')
                }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {/* Joined Groups */}
        {joinedGroups.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">
              Your Groups ({joinedGroups.length})
            </h3>
            <div className="space-y-1">
              {joinedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedGroupId === group.id
                      ? 'bg-blue-500/30 border border-blue-400/50 shadow-glass-sm'
                      : 'hover:bg-glass-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {group.name}
                      </div>
                      {group.description && (
                        <div className="text-xs text-gray-300 mt-1 truncate">
                          {group.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-gray-400">
                        {group.member_count}
                      </span>
                      <CheckIcon className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Groups */}
        {availableGroups.length > 0 && (
          <div className="p-4 border-t border-glass">
            <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">
              Groups You Can Join ({availableGroups.length})
            </h3>
            <div className="space-y-1">
              {availableGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-3 rounded-lg bg-glass-dark border border-glass hover:border-glass-light transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {group.name}
                      </div>
                      {group.description && (
                        <div className="text-xs text-gray-300 mt-1 truncate">
                          {group.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {group.member_count} members
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {groups.length === 0 && (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-sm">No groups available</p>
            <p className="text-gray-400 text-xs mt-1">Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}