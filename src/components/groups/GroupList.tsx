'use client'

import { Database } from '@/lib/supabase'

type Group = Database['public']['Tables']['groups']['Row']

interface GroupListProps {
  groups: Group[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  loading: boolean
}

export default function GroupList({ groups, selectedGroupId, onSelectGroup, loading }: GroupListProps) {
  if (loading) {
    return (
      <div className="bg-glass backdrop-blur-md rounded-xl p-4 border border-glass shadow-glass">
        <h2 className="text-lg font-semibold text-white mb-4">Groups</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-glass rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="bg-glass backdrop-blur-md rounded-xl p-4 border border-glass shadow-glass">
        <h2 className="text-lg font-semibold text-white mb-4">Groups</h2>
        <p className="text-gray-300 text-sm">No groups available. Create one to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-glass backdrop-blur-md rounded-xl p-4 border border-glass shadow-glass">
      <h2 className="text-lg font-semibold text-white mb-4">Groups</h2>
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              selectedGroupId === group.id
                ? 'bg-blue-500/30 border border-blue-400/50 shadow-glass-sm'
                : 'bg-glass hover:bg-glass-dark border border-transparent hover:border-glass'
            }`}
          >
            <div className="font-medium text-white">{group.name}</div>
            {group.description && (
              <div className="text-sm text-gray-300 mt-1 truncate">
                {group.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}