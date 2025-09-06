'use client';

import { useState, useEffect } from 'react';
import { DocumentArrowUpIcon, PhotoIcon, DocumentIcon, XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import AdminRequestDashboard from '@/components/AdminRequestDashboard';
import { getCurrentUser } from '@/lib/auth';

interface UploadedFile {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  preview?: string;
}

export default function AdminPage() {
  const [weekNumber, setWeekNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'requests'>('upload');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
      
      const adminPromise = getCurrentUser();
      const { isAdmin: adminStatus } = await Promise.race([adminPromise, timeoutPromise]) as any;
      
      setIsAdmin(adminStatus || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: UploadedFile[] = selectedFiles.map(file => {
      let type: 'photo' | 'video' | 'pdf';
      if (file.type.startsWith('image/')) {
        type = 'photo';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type === 'application/pdf') {
        type = 'pdf';
      } else {
        type = 'photo'; // Default fallback
      }

      const uploadedFile: UploadedFile = { file, type };
      
      // Create preview for images
      if (type === 'photo') {
        uploadedFile.preview = URL.createObjectURL(file);
      }
      
      return uploadedFile;
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      // Clean up preview URL if it exists
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!weekNumber.trim()) {
      errors.push('Week number is required');
    } else if (isNaN(parseInt(weekNumber)) || parseInt(weekNumber) < 1) {
      errors.push('Week number must be a positive number');
    }
    
    if (!title.trim()) {
      errors.push('Title is required');
    }
    
    if (!description.trim()) {
      errors.push('Description is required');
    }
    
    const photos = files.filter(f => f.type === 'photo');
    const pdfs = files.filter(f => f.type === 'pdf');
    
    if (photos.length === 0) {
      errors.push('At least one photo is required');
    }
    
    if (pdfs.length === 0) {
      errors.push('At least one PDF file is required');
    }
    
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('weekNumber', weekNumber);
      formData.append('title', title);
      formData.append('description', description);
      
      files.forEach(({ file }) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/weeks', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: 'Week uploaded successfully!' });
      
      // Reset form
      setWeekNumber('');
      setTitle('');
      setDescription('');
      setFiles([]);
      
      // Clean up preview URLs
      files.forEach(({ preview }) => {
        if (preview) URL.revokeObjectURL(preview);
      });

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Upload failed' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <PhotoIcon className="w-8 h-8 text-blue-400" />;
      case 'pdf':
        return <DocumentIcon className="w-8 h-8 text-red-400" />;
      default:
        return <DocumentArrowUpIcon className="w-8 h-8 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="animate-pulse">
            <div className="h-8 bg-glass rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-glass rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass text-center animate-fade-in">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <DocumentArrowUpIcon className="w-8 h-8 text-blue-400" />
          Admin Panel
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-glass-dark p-1 rounded-lg border border-glass">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              activeTab === 'upload'
                ? 'bg-glass-light border border-glass text-white shadow-glass-sm'
                : 'text-gray-300 hover:text-white hover:bg-glass'
            }`}
          >
            <DocumentArrowUpIcon className="w-4 h-4 inline mr-2" />
            Upload Content
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              activeTab === 'requests'
                ? 'bg-glass-light border border-glass text-white shadow-glass-sm'
                : 'text-gray-300 hover:text-white hover:bg-glass'
            }`}
          >
            <UserGroupIcon className="w-4 h-4 inline mr-2" />
            Manage Requests
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <div className="animate-slide-in">
            <h2 className="text-xl font-semibold text-white mb-6">Upload Week Content</h2>

            {message && (
              <div className={`mb-6 p-4 rounded-lg border backdrop-blur-md transition-all duration-300 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-300 border-green-400/50' 
                  : 'bg-red-500/20 text-red-300 border-red-400/50'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Week Number and Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="weekNumber" className="block text-sm font-medium text-white mb-2">
                    Week Number *
                  </label>
                  <input
                    type="number"
                    id="weekNumber"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Enter week number"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Enter week title"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
                  placeholder="Enter week description"
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="fileInput" className="block text-sm font-medium text-white mb-2">
                  Files * (At least 1 photo and 1 PDF required)
                </label>
                <div className="border-2 border-dashed border-glass rounded-lg p-6 text-center hover:border-blue-400/50 transition-all duration-300 bg-glass-light backdrop-blur-md">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 transition-colors hover:text-blue-400" />
                    <p className="text-gray-300 mb-2">Click to upload files or drag and drop</p>
                    <p className="text-sm text-gray-400">Supports images, videos, and PDF files</p>
                  </label>
                </div>
              </div>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="animate-slide-in">
                  <h3 className="text-lg font-medium text-white mb-4">Uploaded Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative bg-glass backdrop-blur-md border border-glass rounded-lg p-4 transition-all duration-300 hover:shadow-glass-sm">
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-all duration-200 backdrop-blur-sm"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-2">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {file.file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        {file.preview && (
                          <img
                            src={file.preview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}
                        
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full backdrop-blur-sm ${
                            file.type === 'photo' ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' :
                            file.type === 'pdf' ? 'bg-red-500/30 text-red-300 border border-red-400/50' :
                            'bg-gray-500/30 text-gray-300 border border-gray-400/50'
                          }`}>
                            {file.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* File Summary */}
                  <div className="mt-4 p-4 bg-glass-light rounded-lg border border-glass">
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-300">
                        Photos: {files.filter(f => f.type === 'photo').length}
                      </span>
                      <span className="text-red-300">
                        PDFs: {files.filter(f => f.type === 'pdf').length}
                      </span>
                      <span className="text-green-300">
                        Videos: {files.filter(f => f.type === 'video').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isUploading
                      ? 'bg-gray-500/50 cursor-not-allowed text-gray-300'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-glass hover:shadow-glass-lg transform hover:scale-105'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload Week Content'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-slide-in">
            <AdminRequestDashboard />
          </div>
        )}
      </div>
    </div>
  );
}