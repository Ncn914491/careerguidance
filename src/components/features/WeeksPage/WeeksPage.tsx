'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Modal from '@/components/ui/Modal';
import FileViewer from '@/components/ui/FileViewer';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface WeekFile {
  id: string;
  file_name: string;
  file_type: 'photo' | 'video' | 'pdf';
  file_url: string;
  file_size: number | null;
  created_at: string;
}

interface Week {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  created_at: string;
  week_files: WeekFile[];
}

export default function WeeksPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading, isInitialized } = useAuth();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Redirect to login if not authenticated and auth is initialized
  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, isInitialized, router]);

  useEffect(() => {
    if (user) {
      fetchWeeks();
    }
  }, [user]);

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weeks');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weeks');
      }

      setWeeks(data.weeks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openWeekModal = (week: Week) => {
    setSelectedWeek(week);
    setSelectedFileIndex(0);
  };

  const closeWeekModal = () => {
    setSelectedWeek(null);
    setSelectedFileIndex(0);
  };

  const handleEditWeek = (week: Week) => {
    setEditingWeek(week);
    setEditForm({
      title: week.title,
      description: week.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingWeek || !isAdmin) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/weeks/${editingWeek.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update week');
      }

      // Update the week in the local state
      setWeeks(prev => prev.map(week => 
        week.id === editingWeek.id 
          ? { ...week, title: editForm.title, description: editForm.description }
          : week
      ));

      setEditingWeek(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update week');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!isAdmin || !confirm('Are you sure you want to delete this week? This will also delete all associated files and cannot be undone.')) {
      return;
    }

    setIsDeleting(weekId);
    try {
      const response = await fetch(`/api/weeks/${weekId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete week');
      }

      // Remove the week from local state
      setWeeks(prev => prev.filter(week => week.id !== weekId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete week');
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelEdit = () => {
    setEditingWeek(null);
    setEditForm({ title: '', description: '' });
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-4">Weeks</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <h1 className="text-2xl font-bold text-white mb-4">Weeks</h1>
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchWeeks}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
      <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-4">Weeks</h1>
        <p className="text-gray-300">
          View weekly content and materials from program visits.
        </p>
      </div>

      {weeks.length === 0 ? (
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-400">No weeks available yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in">
          {weeks.map((week) => (
            <div
              key={week.id}
              className="bg-glass backdrop-blur-md rounded-xl p-4 sm:p-6 border border-glass shadow-glass hover:bg-glass-dark hover:shadow-glass-lg hover:border-blue-400/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Week {week.week_number}
                  </h3>
                  <p className="text-gray-400 text-sm">{formatDate(week.created_at)}</p>
                </div>
                
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWeek(week);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit week"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWeek(week.id);
                      }}
                      disabled={isDeleting === week.id}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete week"
                    >
                      {isDeleting === week.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
                
                {/* View Arrow */}
                <button
                  onClick={() => openWeekModal(week)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors ml-2"
                  title="View week"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div 
                className="cursor-pointer"
                onClick={() => openWeekModal(week)}
              >
                <h4 className="text-white font-medium mb-2">{week.title}</h4>
                
                {week.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {week.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {week.week_files.filter(f => f.file_type === 'photo').length > 0 && (
                      <div className="flex items-center space-x-1">
                        {getFileTypeIcon('photo')}
                        <span>{week.week_files.filter(f => f.file_type === 'photo').length}</span>
                      </div>
                    )}
                    {week.week_files.filter(f => f.file_type === 'video').length > 0 && (
                      <div className="flex items-center space-x-1">
                        {getFileTypeIcon('video')}
                        <span>{week.week_files.filter(f => f.file_type === 'video').length}</span>
                      </div>
                    )}
                    {week.week_files.filter(f => f.file_type === 'pdf').length > 0 && (
                      <div className="flex items-center space-x-1">
                        {getFileTypeIcon('pdf')}
                        <span>{week.week_files.filter(f => f.file_type === 'pdf').length}</span>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {week.week_files.length} file{week.week_files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Week Files Modal */}
      {selectedWeek && (
        <Modal
          isOpen={true}
          onClose={closeWeekModal}
          title={`Week ${selectedWeek.week_number}: ${selectedWeek.title}`}
          size="xl"
        >
          <div className="space-y-6">
            {selectedWeek.description && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300">{selectedWeek.description}</p>
              </div>
            )}

            {selectedWeek.week_files.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-400">No files available for this week.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Navigation */}
                {selectedWeek.week_files.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedWeek.week_files.map((file, index) => (
                      <button
                        key={file.id}
                        onClick={() => setSelectedFileIndex(index)}
                        className={`
                          px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2
                          ${selectedFileIndex === index 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }
                        `}
                      >
                        {getFileTypeIcon(file.file_type)}
                        <span className="truncate max-w-32">{file.file_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Current File Viewer */}
                {selectedWeek.week_files[selectedFileIndex] && (
                  <FileViewer file={selectedWeek.week_files[selectedFileIndex]} />
                )}

                {/* Navigation Arrows */}
                {selectedWeek.week_files.length > 1 && (
                  <div className="flex justify-between">
                    <button
                      onClick={() => setSelectedFileIndex(Math.max(0, selectedFileIndex - 1))}
                      disabled={selectedFileIndex === 0}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    <span className="flex items-center text-gray-400 text-sm">
                      {selectedFileIndex + 1} of {selectedWeek.week_files.length}
                    </span>
                    
                    <button
                      onClick={() => setSelectedFileIndex(Math.min(selectedWeek.week_files.length - 1, selectedFileIndex + 1))}
                      disabled={selectedFileIndex === selectedWeek.week_files.length - 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Week Modal */}
      {editingWeek && (
        <Modal
          isOpen={true}
          onClose={cancelEdit}
          title={`Edit Week ${editingWeek.week_number}`}
          size="md"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter week title"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter week description (optional)"
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
                disabled={isEditing || !editForm.title.trim()}
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