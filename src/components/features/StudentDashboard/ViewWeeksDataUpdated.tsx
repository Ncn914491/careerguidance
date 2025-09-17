'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { WeekContentDisplay } from '@/components/features/WeekContent';
import FileViewer from '@/components/ui/FileViewer';

/**
 * Updated ViewWeeksData Component
 * 
 * This component demonstrates the proper usage of the new WeekContentDisplay component.
 * Key improvements:
 * 1. Media content is displayed ABOVE text content
 * 2. Enhanced text formatting with preserved line breaks and paragraphs
 * 3. Cleaner, more modular code structure
 * 4. Better responsive design and error handling
 */

interface WeekFile {
  id: string;
  file_name: string;
  file_type: 'photo' | 'video' | 'pdf';
  file_url: string;
  file_size: number;
}

interface Week {
  id: string;
  week_number: number;
  title: string;
  description: string;
  created_at: string;
  week_files: WeekFile[];
}

export function ViewWeeksDataUpdated() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<WeekFile | null>(null);

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      const response = await fetch('/api/weeks');
      if (response.ok) {
        const data = await response.json();
        setWeeks(data.weeks || []);
      } else {
        console.error('Failed to fetch weeks:', response.status, response.statusText);
        setWeeks([]);
      }
    } catch (error) {
      console.error('Error fetching weeks:', error);
      setWeeks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeekExpansion = (weekId: string) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  const handleFileSelect = (file: WeekFile) => {
    setSelectedFile(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-glass rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <WeekContentDisplay
                key={i}
                week={{} as Week} // Empty week for loading
                isLoading={true}
                className="bg-glass backdrop-blur-md rounded-xl border border-glass"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Weekly Activities</h2>
        <p className="text-gray-300">
          Explore weekly content including photos, videos, and educational materials.
          Notice how media content appears above text for better visual hierarchy.
        </p>
      </div>

      {weeks.length === 0 ? (
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8 text-center">
          <CalendarDaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Content Available</h3>
          <p className="text-gray-300">Weekly activities will appear here once they are published.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) => {
            const isExpanded = expandedWeek === week.id;
            
            return (
              <div key={week.id} className="bg-glass backdrop-blur-md rounded-xl border border-glass overflow-hidden">
                {/* Week Header - Clickable to expand/collapse */}
                <div 
                  className="p-6 cursor-pointer hover:bg-glass-light transition-all duration-300"
                  onClick={() => toggleWeekExpansion(week.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CalendarDaysIcon className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-semibold text-white">
                          Week {week.week_number}: {week.title}
                        </h3>
                      </div>
                      
                      {/* Show preview of description when collapsed */}
                      {!isExpanded && week.description && (
                        <p className="text-gray-300 mb-3 line-clamp-2">
                          {week.description}
                        </p>
                      )}

                      {/* Week metadata */}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Published {new Date(week.created_at).toLocaleDateString()}</span>
                        {week.week_files.length > 0 && (
                          <span>{week.week_files.length} files</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUpIcon className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Week Content - Using the new WeekContentDisplay component */}
                {isExpanded && (
                  <div className="border-t border-glass p-6">
                    <WeekContentDisplay
                      week={week}
                      expanded={true}
                      showAdminControls={false} // Students don't need admin controls
                      onFileSelect={handleFileSelect}
                      className="bg-transparent" // Let parent handle background
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Information Panel */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-green-200 mb-3">
          📋 What&apos;s New in This Update
        </h3>
        <ul className="space-y-2 text-green-100 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>
              <strong>Improved Display Order:</strong> Media files (photos, videos, PDFs) now appear above text content for better visual hierarchy
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>
              <strong>Enhanced Text Formatting:</strong> Text content now preserves line breaks, paragraphs, and proper spacing
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>
              <strong>Responsive Design:</strong> Better mobile experience with adaptive layouts
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>
              <strong>Modular Components:</strong> Cleaner code structure that&apos;s easier to maintain
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}