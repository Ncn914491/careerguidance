'use client';

import { useState, useEffect } from 'react';
import { DocumentArrowUpIcon, PhotoIcon, DocumentIcon, XMarkIcon, TrashIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { authenticatedFormFetch, authenticatedFetch, handleApiResponse } from '@/lib/api-client';

interface CareerResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: 'photo' | 'pdf' | 'ppt' | 'text';
  content_text: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  career_resource_files: {
    id: string;
    file_name: string;
    file_type: 'photo' | 'pdf' | 'ppt';
    file_url: string;
    file_size: number | null;
  }[];
}

interface CareerResourceFile {
  file: File;
  type: 'photo' | 'pdf' | 'ppt';
  preview?: string;
}

export function ManageCareerResources() {
  // Form states
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceType, setResourceType] = useState<'photo' | 'pdf' | 'ppt' | 'text'>('text');
  const [resourceContentText, setResourceContentText] = useState('');
  const [resourceFiles, setResourceFiles] = useState<CareerResourceFile[]>([]);
  const [isResourceUploading, setIsResourceUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  useEffect(() => {
    fetchCareerResources();
  }, []);

  const fetchCareerResources = async () => {
    setResourcesLoading(true);
    try {
      const response = await authenticatedFetch('/api/career-resources');
      const data = await handleApiResponse(response) as { careerResources: CareerResource[] };
      setCareerResources(data.careerResources || []);
    } catch (error) {
      console.error('Failed to fetch career resources:', error);
      setMessage({ type: 'error', text: 'Failed to load career resources' });
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleResourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: CareerResourceFile[] = selectedFiles.map(file => {
      let type: 'photo' | 'pdf' | 'ppt';
      if (file.type.startsWith('image/')) {
        type = 'photo';
      } else if (file.type === 'application/pdf') {
        type = 'pdf';
      } else if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
        type = 'ppt';
      } else {
        type = 'pdf'; // Default fallback
      }

      const uploadedFile: CareerResourceFile = { file, type };
      
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

  const validateResourceForm = () => {
    const errors: string[] = [];
    
    if (!resourceTitle.trim()) {
      errors.push('Title is required');
    }

    if (resourceType !== 'text' && resourceFiles.length === 0) {
      errors.push('At least one file is required for non-text resources');
    }

    if (resourceType === 'text' && !resourceContentText.trim()) {
      errors.push('Content text is required for text resources');
    }
    
    return errors;
  };

  const handleResourceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const errors = validateResourceForm();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    setIsResourceUploading(true);
    setMessage(null);

    try {
      // Create the career resource first
      const resourceData = {
        title: resourceTitle.trim(),
        description: resourceDescription.trim() || null,
        resource_type: resourceType,
        content_text: resourceType === 'text' ? resourceContentText.trim() : null,
        display_order: careerResources.length,
        is_featured: false
      };

      const resourceResponse = await authenticatedFetch('/api/career-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData)
      });
      
      const resourceResult = await handleApiResponse(resourceResponse) as { careerResource: CareerResource };
      const createdResource = resourceResult.careerResource;

      // Upload files if any
      if (resourceFiles.length > 0) {
        const formData = new FormData();
        formData.append('career_resource_id', createdResource.id);
        
        resourceFiles.forEach(({ file }) => {
          formData.append('files', file);
        });

        const filesResponse = await authenticatedFormFetch('/api/career-resources/files', formData);
        await handleApiResponse(filesResponse);
      }

      setMessage({ type: 'success', text: 'Career resource created successfully!' });
      
      // Reset form
      setResourceTitle('');
      setResourceDescription('');
      setResourceType('text');
      setResourceContentText('');
      setResourceFiles([]);
      
      // Clean up preview URLs
      resourceFiles.forEach(({ preview }) => {
        if (preview) URL.revokeObjectURL(preview);
      });

      // Refresh the resources list
      await fetchCareerResources();

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Upload failed' 
      });
    } finally {
      setIsResourceUploading(false);
    }
  };

  const deleteCareerResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career resource? This action cannot be undone.')) {
      return;
    }

    try {
      await authenticatedFetch(`/api/career-resources/${id}`, {
        method: 'DELETE'
      });
      
      setMessage({ type: 'success', text: 'Career resource deleted successfully!' });
      await fetchCareerResources();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Delete failed' 
      });
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <PhotoIcon className="w-8 h-8 text-blue-400" />;
      case 'pdf':
        return <DocumentIcon className="w-8 h-8 text-red-400" />;
      case 'ppt':
        return <DocumentIcon className="w-8 h-8 text-orange-400" />;
      default:
        return <DocumentArrowUpIcon className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <AcademicCapIcon className="w-10 h-10 text-purple-400" />
          Career Resources Management
        </h1>
        <p className="text-gray-300 text-lg">
          Upload and manage career guidance resources for students
        </p>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`p-4 rounded-lg border backdrop-blur-md transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-300 border-green-400/50' 
            : 'bg-red-500/20 text-red-300 border-red-400/50'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8">
        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <DocumentArrowUpIcon className="w-6 h-6 text-green-400" />
          Add New Career Resource
        </h2>

        <form onSubmit={handleResourceSubmit} className="space-y-6">
          {/* Title and Type */}
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
                className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 text-white placeholder-gray-400 transition-all duration-300"
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
                className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 text-white transition-all duration-300"
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
              className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
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
                className="w-full px-4 py-3 bg-glass border border-glass rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
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
              <div className="border-2 border-dashed border-glass rounded-lg p-6 text-center hover:border-purple-400/50 transition-all duration-300 bg-glass-light backdrop-blur-md">
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
                  <div className="flex flex-col items-center">
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
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Resource File Preview */}
          {resourceFiles.length > 0 && (
            <div className="animate-slide-in">
              <h3 className="text-lg font-medium text-white mb-4">Selected Files</h3>
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

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isResourceUploading}
              className={`px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300 border-2 ${
                isResourceUploading
                  ? 'bg-gray-500/50 cursor-not-allowed text-gray-300 border-gray-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-glass hover:shadow-glass-lg transform hover:scale-105 border-purple-400'
              }`}
            >
              {isResourceUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Resource...
                </div>
              ) : (
                '🚀 Create Career Resource'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Resources */}
      <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-400" />
            Existing Career Resources
          </h2>
          <div className="text-sm text-gray-400 bg-glass-light px-3 py-1 rounded-full">
            {careerResources.length} resource{careerResources.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {resourcesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : careerResources.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No career resources uploaded yet.</p>
            <p className="text-gray-500 text-sm">Create your first resource using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careerResources.map((resource) => (
              <div key={resource.id} className="bg-glass-light backdrop-blur-md border border-glass rounded-lg p-6 hover:shadow-glass-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(resource.resource_type)}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-semibold text-lg truncate">{resource.title}</h4>
                      <p className="text-xs text-gray-400 capitalize bg-gray-700/50 px-2 py-1 rounded-full inline-block mt-1">
                        {resource.resource_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCareerResource(resource.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/30 rounded-lg border border-red-400/50 transition-all duration-200 transform hover:scale-110 flex-shrink-0 ml-2"
                    title="Delete resource"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {resource.description && (
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{resource.description}</p>
                )}
                
                {resource.resource_type === 'text' ? (
                  <p className="text-gray-400 text-xs line-clamp-3 bg-gray-800/30 p-2 rounded">{resource.content_text}</p>
                ) : (
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4" />
                    {resource.career_resource_files?.length || 0} file(s)
                  </p>
                )}
                
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 flex items-center justify-between">
                    <span>Created: {new Date(resource.created_at).toLocaleDateString()}</span>
                    {resource.is_featured && (
                      <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                        ⭐ Featured
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
