'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
}

export function ManageGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setMessage({ type: 'error', text: 'Failed to load groups' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Name and description are required' });
      return;
    }

    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingGroup ? 'Group updated successfully' : 'Group created successfully' 
        });
        setFormData({ name: '', description: '' });
        setEditingGroup(null);
        setIsCreating(false);
        fetchGroups();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Operation failed' });
      }
    } catch (error) {
      console.error('Error saving group:', error);
      setMessage({ type: 'error', text: 'Failed to save group' });
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description
    });
    setIsCreating(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Group deleted successfully' });
        fetchGroups();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete group' });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setMessage({ type: 'error', text: 'Failed to delete group' });
    }
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-glass rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-glass rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">Manage Groups</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border backdrop-blur-md transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-300 border-green-400/50' 
            : 'bg-red-500/20 text-red-300 border-red-400/50'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingGroup ? 'Edit Group' : 'Create New Group'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-white mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="groupName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300"
                placeholder="Enter group name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="groupDescription" className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                id="groupDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
                placeholder="Enter group description"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300"
              >
                {editingGroup ? 'Update Group' : 'Create Group'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Groups Yet</h3>
            <p className="text-gray-300 mb-4">Create your first group to get started.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300"
            >
              Create First Group
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 hover:bg-glass-light transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <UserGroupIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                  </div>
                  <p className="text-gray-300 mb-3">{group.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{group.member_count} members</span>
                    </div>
                    <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all duration-300"
                    title="Edit group"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all duration-300"
                    title="Delete group"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}