'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  PhotoIcon, 
  DocumentIcon, 
  PlayIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import FileViewer from '@/components/ui/FileViewer';

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

export function ViewWeeksData() {
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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'photo':
        return <PhotoIcon className="w-5 h-5 text-blue-400" />;
      case 'video':
        return <PlayIcon className="w-5 h-5 text-green-400" />;
      case 'pdf':
        return <DocumentIcon className="w-5 h-5 text-red-400" />;
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupFilesByType = (files: WeekFile[]) => {
    return {
      photos: files.filter(f => f.file_type === 'photo'),
      videos: files.filter(f => f.file_type === 'video'),
      pdfs: files.filter(f => f.file_type === 'pdf')
    };
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
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Weekly Activities</h2>
        <p className="text-gray-300">Explore weekly content including photos, videos, and educational materials.</p>
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
            const { photos, videos, pdfs } = groupFilesByType(week.week_files || []);
            
            return (
              <div key={week.id} className="bg-glass backdrop-blur-md rounded-xl border border-glass overflow-hidden">
                {/* Week Header */}
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
                      <p className="text-gray-300 mb-3">{week.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span>Published {new Date(week.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-4">
                          {photos.length > 0 && (
                            <span className="flex items-center gap-1">
                              <PhotoIcon className="w-4 h-4 text-blue-400" />
                              {photos.length} photos
                            </span>
                          )}
                          {videos.length > 0 && (
                            <span className="flex items-center gap-1">
                              <PlayIcon className="w-4 h-4 text-green-400" />
                              {videos.length} videos
                            </span>
                          )}
                          {pdfs.length > 0 && (
                            <span className="flex items-center gap-1">
                              <DocumentIcon className="w-4 h-4 text-red-400" />
                              {pdfs.length} documents
                            </span>
                          )}
                        </div>
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

                {/* Week Content */}
                {isExpanded && (
                  <div className="border-t border-glass p-6 space-y-6">
                    {/* Photos Section */}
                    {photos.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <PhotoIcon className="w-5 h-5 text-blue-400" />
                          Photos ({photos.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {photos.map((file) => (
                            <div 
                              key={file.id}
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedFile(file)}
                            >
                              <img
                                src={file.file_url}
                                alt={file.file_name}
                                className="w-full h-32 object-cover rounded-lg border border-glass"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                                <EyeIcon className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos Section */}
                    {videos.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <PlayIcon className="w-5 h-5 text-green-400" />
                          Videos ({videos.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {videos.map((file) => (
                            <div key={file.id} className="bg-glass-light rounded-lg p-4 border border-glass">
                              <video
                                controls
                                className="w-full h-48 rounded-lg"
                                preload="metadata"
                              >
                                <source src={file.file_url} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-sm text-white truncate">{file.file_name}</span>
                                <span className="text-xs text-gray-400">{formatFileSize(file.file_size)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PDFs Section */}
                    {pdfs.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <DocumentIcon className="w-5 h-5 text-red-400" />
                          Documents ({pdfs.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pdfs.map((file) => (
                            <div 
                              key={file.id}
                              className="bg-glass-light rounded-lg p-4 border border-glass hover:bg-glass transition-all duration-300 cursor-pointer"
                              onClick={() => setSelectedFile(file)}
                            >
                              <div className="flex items-center gap-3">
                                <DocumentIcon className="w-8 h-8 text-red-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{file.file_name}</p>
                                  <p className="text-sm text-gray-400">{formatFileSize(file.file_size)}</p>
                                </div>
                                <EyeIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
    </div>
  );
}