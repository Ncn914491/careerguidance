'use client';

import { useState } from 'react';

interface FileViewerProps {
  file: {
    id: string;
    file_name: string;
    file_type: 'photo' | 'video' | 'pdf';
    file_url: string;
    file_size: number | null;
  };
}

export default function FileViewer({ file }: FileViewerProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileContent = () => {
    switch (file.file_type) {
      case 'photo':
        return (
          <div className="space-y-4">
            {!imageError ? (
              <img
                src={file.file_url}
                alt={file.file_name}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Failed to load image</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            {!videoError ? (
              <video
                controls
                className="w-full h-auto max-h-96 rounded-lg"
                onError={() => setVideoError(true)}
              >
                <source src={file.file_url} type="video/mp4" />
                <source src={file.file_url} type="video/webm" />
                <source src={file.file_url} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Failed to load video</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">{file.file_name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(file.file_size)}</p>
                  </div>
                </div>
                <button
                  onClick={downloadFile}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 active:scale-95 shadow-glass hover:shadow-glass-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
              
              {/* PDF Inline Viewer */}
              <div className="w-full h-64 sm:h-96 bg-white rounded">
                <iframe
                  src={`${file.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full rounded"
                  title={file.file_name}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Unsupported file type</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-white">{file.file_name}</h4>
          <p className="text-gray-400 text-sm capitalize">
            {file.file_type} • {formatFileSize(file.file_size)}
          </p>
        </div>
        <button
          onClick={downloadFile}
          className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-glass-dark transform hover:scale-110 active:scale-95"
          title="Download file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
      
      {renderFileContent()}
    </div>
  );
}