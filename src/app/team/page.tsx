'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, AcademicCapIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import { authenticatedFetch, handleApiResponse } from '@/lib/api-client';
import Modal from '@/components/ui/Modal';

interface TeamMember {
  id: string;
  name: string;
  roll_number: string;
  position: string;
  created_at: string;
}

export default function TeamPage() {
  const { isAdmin, user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', position: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError(error instanceof Error ? error.message : 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({ name: member.name, position: member.position });
  };

  const handleSaveEdit = async () => {
    if (!editingMember || !isAdmin || !user) return;

    setIsEditing(true);
    try {
      const response = await authenticatedFetch(`/api/team/${editingMember.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          position: editForm.position
        })
      });

      await handleApiResponse(response);
      
      // Update the member in the list
      setTeamMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === editingMember.id 
            ? { ...member, name: editForm.name, position: editForm.position }
            : member
        )
      );
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to update team member');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!isAdmin || !user || !confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    setIsDeleting(memberId);
    try {
      const response = await authenticatedFetch(`/api/team/${memberId}`, {
        method: 'DELETE'
      });

      await handleApiResponse(response);
      
      // Remove the member from the list
      setTeamMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
    } catch (err) {
      console.error('Failed to delete team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete team member');
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setEditForm({ name: '', position: '' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="animate-pulse">
            <div className="h-8 bg-glass rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-glass rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-glass rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">
              <UserGroupIcon className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Team</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchTeamMembers}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <UserGroupIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Our Team</h1>
        </div>
        <p className="text-gray-300 mb-8 text-lg">
          Meet our dedicated team members working on the career guidance program.
        </p>

        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Team Members Found</h3>
            <p className="text-gray-300">Team member information will be displayed here once available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="bg-glass-light backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass hover:shadow-glass-lg transition-all duration-300 transform hover:scale-105 animate-slide-in relative group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {member.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-400/30">
                      {member.roll_number}
                    </div>
                    
                    {member.position && (
                      <p className="text-gray-300 text-sm">
                        {member.position}
                      </p>
                    )}
                  </div>
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                        title="Edit team member"
                      >
                        <PencilIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        disabled={isDeleting === member.id}
                        className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Delete team member"
                      >
                        {isDeleting === member.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        ) : (
                          <TrashIcon className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {teamMembers.length > 0 && (
          <div className="mt-8 p-4 bg-glass-light rounded-lg border border-glass">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Total Team Members: {teamMembers.length}</span>
              <span>Career Guidance Program 2024</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Team Member Modal */}
      {editingMember && (
        <Modal
          isOpen={true}
          onClose={cancelEdit}
          title={`Edit Team Member: ${editingMember.name}`}
          size="md"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team member name"
              />
            </div>
            
            <div>
              <label htmlFor="edit-position" className="block text-sm font-medium text-gray-300 mb-2">
                Position
              </label>
              <input
                id="edit-position"
                type="text"
                value={editForm.position}
                onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter position/role"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                disabled={isEditing}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isEditing || !editForm.name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isEditing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isEditing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
