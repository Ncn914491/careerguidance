/**
 * WeekMediaSection Component
 * 
 * Handles display of media files (photos, videos, PDFs) for a week.
 * Displays media in a responsive grid layout with proper categorization.
 */

import { 
  PhotoIcon, 
  PlayIcon, 
  DocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface WeekFile {
  id: string;
  file_name: string;
  file_type: 'photo' | 'video' | 'pdf';
  file_url: string;
  file_size: number;
}

interface WeekMediaSectionProps {
  files: WeekFile[];
  onFileSelect: (file: WeekFile) => void;
}

export function WeekMediaSection({ files, onFileSelect }: WeekMediaSectionProps) {
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

  const { photos, videos, pdfs } = groupFilesByType(files);

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No media files available for this week</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                onClick={() => onFileSelect(file)}
              >
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="w-full h-32 object-cover rounded-lg border border-glass transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                  <EyeIcon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white bg-black/70 rounded px-2 py-1 truncate">
                    {file.file_name}
                  </p>
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
                onClick={() => onFileSelect(file)}
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
  );
}