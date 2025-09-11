'use client';

import { useState, useEffect } from 'react';
import { DocumentArrowUpIcon, PhotoIcon, DocumentIcon, XMarkIcon, CalendarDaysIcon, AcademicCapIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { authenticatedFetch, authenticatedFormFetch, handleApiResponse } from '@/lib/api-client';

interface UploadedFile {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  preview?: string;
}

interface CareerResource {
  id: string;
  title: string;
  resource_type: 'photo' | 'pdf' | 'ppt' | 'text';
  description?: string;
  content_text?: string;
  created_at: string;
  career_resource_files?: Array<{
    id: string;
    file_name: string;
    file_url: string;
  }>;
}


function AdminPageContent() {
  // Tab state
  const [activeTab, setActiveTab] = useState('weeks');

  // Week upload state
  const [weekNumber, setWeekNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Career Resources state
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState<'photo' | 'pdf' | 'ppt' | 'text'>('text');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceContentText, setResourceContentText] = useState('');
  const [resourceFiles, setResourceFiles] = useState<UploadedFile[]>([]);
  const [isResourceUploading, setIsResourceUploading] = useState(false);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

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

      const { authenticatedFormFetch, handleApiResponse } = await import('@/lib/api-client');
      const response = await authenticatedFormFetch('/api/weeks', formData);

      await handleApiResponse(response);

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
      case 'ppt':
        return <DocumentArrowUpIcon className="w-8 h-8 text-orange-400" />;
      default:
        return <DocumentArrowUpIcon className="w-8 h-8 text-gray-400" />;
    }
  };

  // Career Resources handlers
  const handleResourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: UploadedFile[] = selectedFiles.map(file => {
      let type: 'photo' | 'video' | 'pdf';
      if (file.type.startsWith('image/')) {
        type = 'photo';
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

    setResourceFiles(prev => [...prev, ...newFiles]);
  };

  const removeResourceFile = (index: number) => {
    setResourceFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const fetchCareerResources = async () => {
    try {
      setResourcesLoading(true);
      const response = await authenticatedFetch('/api/career-resources');
      const result = await handleApiResponse<{ resources: CareerResource[] }>(response);
      setCareerResources(result.resources || []);
    } catch (error) {
      console.error('Failed to fetch career resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleResourceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!resourceTitle.trim()) {
      setMessage({ type: 'error', text: 'Resource title is required' });
      return;
    }

    if (resourceType !== 'text' && resourceFiles.length === 0) {
      setMessage({ type: 'error', text: `At least one ${resourceType} file is required` });
      return;
    }

    if (resourceType === 'text' && !resourceContentText.trim()) {
      setMessage({ type: 'error', text: 'Content text is required for text resources' });
      return;
    }

    setIsResourceUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', resourceTitle);
      formData.append('resource_type', resourceType);
      if (resourceDescription.trim()) {
        formData.append('description', resourceDescription);
      }
      if (resourceType === 'text') {
        formData.append('content_text', resourceContentText);
      }
      
      resourceFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      const response = await authenticatedFormFetch('/api/career-resources', formData);
      await handleApiResponse(response);

      setMessage({ type: 'success', text: 'Career resource uploaded successfully!' });
      
      // Reset form
      setResourceTitle('');
      setResourceType('text');
      setResourceDescription('');
      setResourceContentText('');
      setResourceFiles([]);
      
      // Clean up preview URLs
      resourceFiles.forEach(({ preview }) => {
        if (preview) URL.revokeObjectURL(preview);
      });

      // Refresh the resources list
      fetchCareerResources();

    } catch (error) {
      console.error('Resource upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Upload failed' 
      });
    } finally {
      setIsResourceUploading(false);
    }
  };

  const deleteCareerResource = async (resourceId: string) => {
    try {
      const response = await authenticatedFetch(`/api/career-resources?id=${resourceId}`, { method: 'DELETE' });
      await handleApiResponse(response);
      setMessage({ type: 'success', text: 'Career resource deleted successfully!' });
      fetchCareerResources();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Delete failed' 
      });
    }
  };

  // Load career resources on component mount
  useEffect(() => {
    if (activeTab === 'career-resources') {
      fetchCareerResources();
    }
  }, [activeTab]);



  return (
    <div className="space-y-6">
      <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <DocumentArrowUpIcon className="w-8 h-8 text-blue-400" />
          Admin Panel
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('weeks')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'weeks' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <CalendarDaysIcon className="w-5 h-5" />
            Week Content
          </button>
          <button
            onClick={() => setActiveTab('career-resources')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'career-resources' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <AcademicCapIcon className="w-5 h-5" />
            Career Resources
          </button>
        </div>

        {/* Week Upload Tab */}
        {activeTab === 'weeks' && (
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
        )}

        {/* Career Resources Tab */}
        {activeTab === 'career-resources' && (
          <div className="animate-slide-in">
            <h2 className="text-xl font-semibold text-white mb-6">Manage Career Resources</h2>
            
            {/* Show success/error messages at the top */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg border backdrop-blur-md transition-all duration-300 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-300 border-green-400/50' 
                  : 'bg-red-500/20 text-red-300 border-red-400/50'
              }`}>
                {message.text}
              </div>
            )}
            
            {/* Career Resource Upload Form */}
            <div className="bg-glass-light/50 border border-glass rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DocumentArrowUpIcon className="w-5 h-5 text-green-400" />
                Add New Career Resource
              </h3>
              <form onSubmit={handleResourceSubmit} className="space-y-6">
              {/* Resource Title and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="resourceTitle" className="block text-sm font-medium text-white mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="resourceTitle"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Enter resource title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="resourceType" className="block text-sm font-medium text-white mb-2">
                    Resource Type *
                  </label>
                  <select
                    id="resourceType"
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as 'photo' | 'pdf' | 'ppt' | 'text')}
                    className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white transition-all duration-300"
                    required
                  >
                    <option value="text">Text Content</option>
                    <option value="photo">Photo</option>
                    <option value="pdf">PDF Document</option>
                    <option value="ppt">PowerPoint Presentation</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="resourceDescription" className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  id="resourceDescription"
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
                  placeholder="Enter resource description (optional)"
                />
              </div>

              {/* Text Content (if type is text) */}
              {resourceType === 'text' && (
                <div>
                  <label htmlFor="resourceContentText" className="block text-sm font-medium text-white mb-2">
                    Content Text *
                  </label>
                  <textarea
                    id="resourceContentText"
                    value={resourceContentText}
                    onChange={(e) => setResourceContentText(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
                    placeholder="Enter career guidance content..."
                    required
                  />
                </div>
              )}

              {/* File Upload (if not text type) */}
              {resourceType !== 'text' && (
                <div>
                  <label htmlFor="resourceFileInput" className="block text-sm font-medium text-white mb-2">
                    Files * (Required for {resourceType} resources)
                  </label>
                  <div className="border-2 border-dashed border-glass rounded-lg p-6 text-center hover:border-blue-400/50 transition-all duration-300 bg-glass-light backdrop-blur-md">
                    <input
                      type="file"
                      multiple
                      accept={
                        resourceType === 'photo' ? 'image/*' :
                        resourceType === 'pdf' ? '.pdf' :
                        resourceType === 'ppt' ? '.ppt,.pptx' : '*'
                      }
                      onChange={handleResourceFileChange}
                      className="hidden"
                      id="resourceFileInput"
                    />
                    <label htmlFor="resourceFileInput" className="cursor-pointer">
                      {getFileIcon(resourceType)}
                      <div className="mt-4">
                        <p className="text-gray-300 mb-2">Click to upload {resourceType} files</p>
                        <p className="text-sm text-gray-400">
                          Supports {
                            resourceType === 'photo' ? 'images (JPG, PNG, etc.)' :
                            resourceType === 'pdf' ? 'PDF documents' :
                            'PowerPoint presentations (.ppt, .pptx)'
                          }
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Resource File Preview */}
              {resourceFiles.length > 0 && (
                <div className="animate-slide-in">
                  <h3 className="text-lg font-medium text-white mb-4">Resource Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resourceFiles.map((file, index) => (
                      <div key={index} className="relative bg-glass backdrop-blur-md border border-glass rounded-lg p-4">
                        <button
                          type="button"
                          onClick={() => removeResourceFile(index)}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isResourceUploading}
                  className={`px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300 border-2 ${
                    isResourceUploading
                      ? 'bg-gray-500/50 cursor-not-allowed text-gray-300 border-gray-400'
                      : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-glass hover:shadow-glass-lg transform hover:scale-105 border-green-400'
                  }`}
                >
                  {isResourceUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading Career Resource...
                    </div>
                  ) : (
                    '📤 Upload Career Resource'
                  )}
                </button>
              </div>
            </form>
            </div>
            
            {/* Test Section - Remove this after debugging */}
            <div className="bg-yellow-500/10 border border-yellow-400/50 rounded-lg p-4 mb-6">
              <h4 className="text-yellow-300 font-semibold mb-2">🔧 Debug Info:</h4>
              <div className="text-sm text-yellow-200 space-y-1">
                <p>Active Tab: {activeTab}</p>
                <p>Resources Loading: {resourcesLoading ? 'Yes' : 'No'}</p>
                <p>Resources Count: {careerResources.length}</p>
                <p>Upload State: {isResourceUploading ? 'Uploading' : 'Ready'}</p>
                <button 
                  onClick={() => fetchCareerResources()}
                  className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                >
                  🔄 Refresh Resources
                </button>
              </div>
            </div>
            
            {/* Existing Career Resources */}
            <div className="border-t border-glass pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Existing Resources</h3>
                <div className="text-sm text-gray-400">
                  {careerResources.length} resource{careerResources.length !== 1 ? 's' : ''} found
                </div>
              </div>
              {resourcesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : careerResources.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No career resources uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {careerResources.map((resource) => (
                    <div key={resource.id} className="bg-glass backdrop-blur-md border border-glass rounded-lg p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(resource.resource_type)}
                          <div>
                            <h4 className="text-white font-semibold text-sm">{resource.title}</h4>
                            <p className="text-xs text-gray-400 capitalize">{resource.resource_type}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCareerResource(resource.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/30 rounded-lg border border-red-400/50 transition-all duration-200 transform hover:scale-110"
                          title="Delete resource"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {resource.description && (
                        <p className="text-gray-300 text-sm mb-3">{resource.description}</p>
                      )}
                      
                      {resource.resource_type === 'text' ? (
                        <p className="text-gray-400 text-xs line-clamp-3">{resource.content_text}</p>
                      ) : (
                        <p className="text-gray-400 text-xs">
                          {resource.career_resource_files?.length || 0} file(s)
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(resource.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <AdminPageContent />
    </AuthGuard>
  );
}