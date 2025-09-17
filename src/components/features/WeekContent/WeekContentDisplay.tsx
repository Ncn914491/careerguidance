import { useState } from 'react';
import { WeekMediaSection } from './WeekMediaSection';
import { WeekTextSection } from './WeekTextSection';
import { DocumentTextIcon, PhotoIcon, VideoCameraIcon, DocumentIcon } from '@heroicons/react/24/outline';

/**
 * WeekContentDisplay Component
 * 
 * Unified component that displays weekly content with proper ordering:
 * 1. Media content (photos, videos, PDFs) - displayed first
 * 2. Text content (title, description) - displayed below media
 * 
 * Features:
 * - Responsive design that works on all screen sizes
 * - Modular architecture with reusable components
 * - Handles multiple media files and text blocks
 * - Clean, maintainable code structure
 * - Proper loading states and error handling
 * - Accessible and keyboard-friendly
 */

interface WeekFile {
  id: string;
  file_name: string;
  file_type: 'photo' | 'video' | 'pdf';
  file_url: string;
  file_size: number;
  created_at?: string;
}

interface WeekData {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  created_at: string;
  week_files: WeekFile[];
}

interface WeekContentDisplayProps {
  week: WeekData;
  /** Whether to show the content in expanded/detailed view */
  expanded?: boolean;
  /** Whether to show administrative controls */
  showAdminControls?: boolean;
  /** Callback when a file is selected for viewing */
  onFileSelect?: (file: WeekFile) => void;
  /** Callback when edit action is triggered */
  onEdit?: (week: WeekData) => void;
  /** Callback when delete action is triggered */
  onDelete?: (weekId: string) => void;
  /** Custom CSS classes */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
}

export function WeekContentDisplay({
  week,
  expanded = true,
  showAdminControls = false,
  onFileSelect,
  onEdit,
  onDelete,
  className = '',
  isLoading = false
}: WeekContentDisplayProps) {

  // Handle file selection
  const handleFileSelect = (file: WeekFile) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  // Get content statistics
  const stats = {
    photos: week.week_files.filter(f => f.file_type === 'photo').length,
    videos: week.week_files.filter(f => f.file_type === 'video').length,
    pdfs: week.week_files.filter(f => f.file_type === 'pdf').length,
    total: week.week_files.length
  };

  const hasMedia = stats.total > 0;
  const hasText = week.title || week.description;

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="aspect-video bg-gray-700 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasMedia && !hasText) {
    return (
      <div className={`text-center py-12 text-gray-400 ${className}`}>
        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
        <p className="text-sm">This week doesn&apos;t have any content yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Week Header - Always show if we have content */}
      {(hasMedia || hasText) && (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Week {week.week_number}
              {week.title && `: ${week.title}`}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>
                Published {new Date(week.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {hasMedia && (
                <div className="flex items-center gap-3">
                  {stats.photos > 0 && (
                    <span className="flex items-center gap-1">
                      <PhotoIcon className="w-4 h-4 text-blue-400" />
                      {stats.photos}
                    </span>
                  )}
                  {stats.videos > 0 && (
                    <span className="flex items-center gap-1">
                      <VideoCameraIcon className="w-4 h-4 text-green-400" />
                      {stats.videos}
                    </span>
                  )}
                  {stats.pdfs > 0 && (
                    <span className="flex items-center gap-1">
                      <DocumentIcon className="w-4 h-4 text-red-400" />
                      {stats.pdfs}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Admin Controls */}
          {showAdminControls && (onEdit || onDelete) && (
            <div className="flex items-center gap-2 ml-4">
              {onEdit && (
                <button
                  onClick={() => onEdit(week)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  title="Edit week"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(week.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete week"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MEDIA SECTION - Displayed FIRST */}
      {hasMedia && expanded && (
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
          <WeekMediaSection 
            files={week.week_files} 
            onFileSelect={handleFileSelect}
          />
        </div>
      )}

      {/* TEXT SECTION - Displayed BELOW media */}
      {hasText && expanded && (
        <div className="bg-gray-800/20 rounded-xl p-6 border border-gray-700/30">
          <WeekTextSection
            title={week.title}
            description={week.description || ''}
            weekNumber={week.week_number}
            publishedDate={week.created_at}
          />
        </div>
      )}

      {/* Compact view when not expanded */}
      {!expanded && (
        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                Week {week.week_number}: {week.title}
              </h3>
              {week.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {week.description}
                </p>
              )}
            </div>
            {hasMedia && (
              <div className="flex items-center gap-2 ml-4 text-xs text-gray-400">
                <span>{stats.total} files</span>
                {stats.photos > 0 && <PhotoIcon className="w-4 h-4 text-blue-400" />}
                {stats.videos > 0 && <VideoCameraIcon className="w-4 h-4 text-green-400" />}
                {stats.pdfs > 0 && <DocumentIcon className="w-4 h-4 text-red-400" />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeekContentDisplay;