'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Modal from '@/components/ui/Modal';
import FileViewer from '@/components/ui/FileViewer';
import { PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

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


// Enhanced WeekCard component with slideshow
interface WeekCardProps {
  week: Week;
  isAdmin: boolean;
  onEdit: (week: Week) => void;
  onDelete: (weekId: string) => void;
  isDeleting: boolean;
}

function WeekCard({ week, isAdmin, onEdit, onDelete, isDeleting }: WeekCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<WeekFile | null>(null);
  
  const photos = week.week_files.filter(f => f.file_type === 'photo');
  const pdfs = week.week_files.filter(f => f.file_type === 'pdf');
  
  // Auto slideshow functionality
  useEffect(() => {
    if (isAutoPlay && photos.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === photos.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000); // Change image every 4 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, photos.length]);
  
  const nextImage = () => {
    setCurrentImageIndex(currentImageIndex === photos.length - 1 ? 0 : currentImageIndex + 1);
  };
  
  const prevImage = () => {
    setCurrentImageIndex(currentImageIndex === 0 ? photos.length - 1 : currentImageIndex - 1);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass overflow-hidden">
      {/* Week Header */}
      <div className="p-6 border-b border-glass">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Week {week.week_number}: {week.title}
            </h2>
            <p className="text-gray-400 text-sm mb-4">{formatDate(week.created_at)}</p>
          </div>
          
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onEdit(week)}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                title="Edit week"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(week.id)}
                disabled={isDeleting}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                title="Delete week"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-6 space-y-6">
        {/* Photo Slideshow */}
        {photos.length > 0 && (
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-4">Photo Gallery</h3>
            
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <img
                src={photos[currentImageIndex]?.file_url}
                alt={photos[currentImageIndex]?.file_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
                }}
              />
              
              {/* Navigation Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                  
                  {/* Auto-play Control */}
                  <button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    title={isAutoPlay ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isAutoPlay ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentImageIndex + 1} / {photos.length}
              </div>
            </div>
          </div>
        )}
        
        {/* Description */}
        {week.description && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed">{week.description}</p>
          </div>
        )}
        
        {/* PDF Viewer */}
        {pdfs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">{pdf.file_name}</p>
                        <p className="text-gray-400 text-sm">{Math.round((pdf.file_size || 0) / 1024)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPdf(pdf)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                    >
                      View PDF
                    </button>
                  </div>
                  
                  {/* PDF Preview */}
                  <div className="bg-white rounded h-40 flex items-center justify-center">
                    <iframe
                      src={`${pdf.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full rounded pointer-events-none"
                      title={`${pdf.file_name} preview`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* PDF Modal */}
      {selectedPdf && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPdf(null)}
          title={selectedPdf.file_name}
          size="xl"
        >
          <div className="bg-white rounded-lg" style={{height: '600px'}}>
            <iframe
              src={`${selectedPdf.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full rounded-lg"
              title={selectedPdf.file_name}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function WeeksPage() {
  const { isAdmin } = useAuth();
  
  // Use simple state instead of complex data fetching hook
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch weeks data
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/weeks');
        if (!response.ok) {
          throw new Error('Failed to fetch weeks');
        }
        
        const data = await response.json();
        console.log('Weeks data received:', data);
        setWeeks(data.weeks || []);
      } catch (err) {
        console.error('Error fetching weeks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weeks');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeks();
  }, []);

  // Refetch weeks when needed
  const refetchWeeks = () => {
    setWeeks([]);
    setLoading(true);
    // Trigger re-fetch
    const fetchWeeks = async () => {
      try {
        const response = await fetch('/api/weeks');
        if (response.ok) {
          const data = await response.json();
          setWeeks(data.weeks || []);
        }
      } catch {
        setError('Failed to refresh weeks');
      } finally {
        setLoading(false);
      }
    };
    fetchWeeks();
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

      // Refetch weeks to get updated data
      refetchWeeks();

      setEditingWeek(null);
      // Error is now handled by the hook
    } catch (err) {
      console.error('Failed to update week:', err);
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

      // Refetch weeks to get updated data
      refetchWeeks();
      // Error is now handled by the hook
    } catch (err) {
      console.error('Failed to delete week:', err);
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


  // Since weeks are publicly accessible, we don't need to wait for auth initialization
  // Only show loading for the actual data fetch
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
              onClick={refetchWeeks}
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
        <div className="space-y-8">
          {weeks.map((week) => (
            <WeekCard key={week.id} week={week} isAdmin={isAdmin} onEdit={handleEditWeek} onDelete={handleDeleteWeek} isDeleting={isDeleting === week.id} />
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
                  <FileViewer 
                    file={selectedWeek.week_files[selectedFileIndex]} 
                    onClose={closeWeekModal}
                  />
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