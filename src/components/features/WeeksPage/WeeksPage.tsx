'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Modal from '@/components/ui/Modal';
import FileViewer from '@/components/ui/FileViewer';
import { authenticatedFetch, handleApiResponse } from '@/lib/api-client';
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


// Compact WeekWidget component for grid display
interface WeekWidgetProps {
  week: Week;
  isAdmin: boolean;
  onEdit: (week: Week) => void;
  onDelete: (weekId: string) => void;
  isDeleting: boolean;
  onClick: () => void;
}

function WeekWidget({ week, isAdmin, onEdit, onDelete, isDeleting, onClick }: WeekWidgetProps) {
  const photos = week.week_files.filter(f => f.file_type === 'photo');
  const pdfs = week.week_files.filter(f => f.file_type === 'pdf');
  const videos = week.week_files.filter(f => f.file_type === 'video');
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={onClick}>
      {/* Preview Image */}
      <div className="relative h-48 overflow-hidden">
        {photos.length > 0 ? (
          <img
            src={photos[0]?.file_url}
            alt={`Week ${week.week_number} preview`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+V2VlayAke3dlZWsud2Vla19udW1iZXJ9PC90ZXh0Pgo8L3N2Zz4=';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">No Preview</p>
            </div>
          </div>
        )}
        
        {/* Admin Controls Overlay */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(week);
              }}
              className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              title="Edit week"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(week.id);
              }}
              disabled={isDeleting}
              className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Delete week"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              ) : (
                <TrashIcon className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
        
        {/* File Count Badge */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {week.week_files.length} files
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
          Week {week.week_number}
        </h3>
        <h4 className="text-sm font-medium text-gray-300 mb-2 line-clamp-2">
          {week.title}
        </h4>
        <p className="text-xs text-gray-400 mb-3">{formatDate(week.created_at)}</p>
        
        {/* File Type Summary */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {photos.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{photos.length}</span>
            </div>
          )}
          {pdfs.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>{pdfs.length}</span>
            </div>
          )}
          {videos.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{videos.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced WeekCard component with slideshow
interface WeekCardProps {
  week: Week;
  isAdmin: boolean;
  onEdit: (week: Week) => void;
  onDelete: (weekId: string) => void;
  isDeleting: boolean;
}

// Enhanced WeekModal component
interface WeekModalProps {
  week: Week;
  isOpen: boolean;
  onClose: () => void;
}

function WeekModal({ week, isOpen, onClose }: WeekModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<WeekFile | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'pdfs' | 'videos'>('photos');
  
  const photos = week.week_files.filter(f => f.file_type === 'photo');
  const pdfs = week.week_files.filter(f => f.file_type === 'pdf');
  const videos = week.week_files.filter(f => f.file_type === 'video');
  
  // Auto slideshow functionality
  useEffect(() => {
    if (isAutoPlay && photos.length > 1 && activeTab === 'photos') {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === photos.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, photos.length, activeTab]);
  
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Week ${week.week_number}: ${week.title}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Description */}
        {week.description && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">{week.description}</p>
          </div>
        )}
        
        {/* File Type Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
          {photos.length > 0 && (
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'photos' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photos ({photos.length})
            </button>
          )}
          {pdfs.length > 0 && (
            <button
              onClick={() => setActiveTab('pdfs')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'pdfs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Documents ({pdfs.length})
            </button>
          )}
          {videos.length > 0 && (
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'videos' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Videos ({videos.length})
            </button>
          )}
        </div>
        
        {/* Photo Slideshow */}
        {activeTab === 'photos' && photos.length > 0 && (
          <div className="relative">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{aspectRatio: '16/10'}}>
              <img
                src={photos[currentImageIndex]?.file_url}
                alt={photos[currentImageIndex]?.file_name}
                className="w-full h-full object-contain" // Changed from object-cover to object-contain and made smaller
                style={{maxHeight: '400px'}} // Reduced height
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPHN2Zz4=';
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
            
            {/* Image Filename */}
            <p className="text-center text-gray-400 text-sm mt-2">
              {photos[currentImageIndex]?.file_name}
            </p>
          </div>
        )}
        
        {/* PDF Viewer */}
        {activeTab === 'pdfs' && pdfs.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
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
                    View Full PDF
                  </button>
                </div>
                
                {/* PDF Preview */}
                <div className="bg-white rounded overflow-hidden" style={{height: '500px'}}> {/* Increased height */}
                  <iframe
                    src={`${pdf.file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full"
                    title={`${pdf.file_name} preview`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Video Player */}
        {activeTab === 'videos' && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">{video.file_name}</p>
                    <p className="text-gray-400 text-sm">{Math.round((video.file_size || 0) / 1024)} KB</p>
                  </div>
                </div>
                <div className="bg-black rounded overflow-hidden aspect-video">
                  <video
                    src={video.file_url}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Enhanced PDF Modal */}
      {selectedPdf && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPdf(null)}
          title={selectedPdf.file_name}
          size="full" // Use full size for better PDF viewing
        >
          <div className="bg-white rounded-lg" style={{height: '80vh', minHeight: '600px'}}> {/* Increased size */}
            <iframe
              src={`${selectedPdf.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full rounded-lg"
              title={selectedPdf.file_name}
            />
          </div>
        </Modal>
      )}
    </Modal>
  );
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

// Career Resource interfaces
interface CareerResourceFile {
  id: string;
  file_name: string;
  file_type: 'photo' | 'pdf' | 'ppt';
  file_url: string;
  file_size: number | null;
  created_at: string;
}

interface CareerResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: 'photo' | 'pdf' | 'ppt' | 'text';
  content_text: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  career_resource_files: CareerResourceFile[];
}

export default function WeeksPage() {
  const { isAdmin, user } = useAuth();
  
  // Use simple state instead of complex data fetching hook
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [careerResourcesLoading, setCareerResourcesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerResourcesError, setCareerResourcesError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [selectedCareerResource, setSelectedCareerResource] = useState<CareerResource | null>(null);
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

  // Fetch career resources data
  useEffect(() => {
    const fetchCareerResources = async () => {
      try {
        setCareerResourcesLoading(true);
        setCareerResourcesError(null);
        
        const response = await fetch('/api/career-resources');
        if (!response.ok) {
          // If API returns 404 or 500, likely tables don't exist yet
          if (response.status === 404 || response.status === 500) {
            setCareerResources([]);
            setCareerResourcesError(null);
            return;
          }
          throw new Error('Failed to fetch career resources');
        }
        
        const data = await response.json();
        setCareerResources(data.careerResources || []);
      } catch (err) {
        console.error('Error fetching career resources:', err);
        setCareerResourcesError(err instanceof Error ? err.message : 'Failed to load career resources');
      } finally {
        setCareerResourcesLoading(false);
      }
    };

    fetchCareerResources();
  }, []);

  // Refetch weeks when needed (mainly for error recovery)
  const refetchWeeks = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await fetch('/api/weeks');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch weeks'}`);
      }
      
      const data = await response.json();
      setWeeks(data.weeks || []);
      setError(null); // Clear errors on successful fetch
    } catch (err) {
      console.error('Error refetching weeks:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh weeks';
      setError(errorMessage);
      // Don't clear weeks on error - keep the existing data
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
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
    if (!editingWeek || !isAdmin || !user) return;

    setIsEditing(true);
    try {
      const response = await authenticatedFetch(`/api/weeks/${editingWeek.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description
        })
      });

      const data = await handleApiResponse(response);

      // Update local state immediately for better UX
      setWeeks(prevWeeks => 
        prevWeeks.map(week => 
          week.id === editingWeek.id 
            ? { ...week, title: editForm.title, description: editForm.description }
            : week
        )
      );
      
      setEditingWeek(null);
      setError(null); // Clear any previous errors
      
    } catch (err) {
      console.error('Failed to update week:', err);
      setError(err instanceof Error ? err.message : 'Failed to update week');
      
      // On error, try to refetch to get the correct state
      try {
        await refetchWeeks();
      } catch (refetchErr) {
        console.error('Failed to refetch weeks after error:', refetchErr);
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!isAdmin || !user || !confirm('Are you sure you want to delete this week? This will also delete all associated files and cannot be undone.')) {
      return;
    }

    setIsDeleting(weekId);
    try {
      const response = await authenticatedFetch(`/api/weeks/${weekId}`, {
        method: 'DELETE'
      });

      const data = await handleApiResponse(response);

      // Update local state immediately
      setWeeks(prevWeeks => prevWeeks.filter(week => week.id !== weekId));
      setError(null); // Clear any previous errors
      
    } catch (err) {
      console.error('Failed to delete week:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete week');
      
      // On error, try to refetch to get the correct state
      try {
        await refetchWeeks();
      } catch (refetchErr) {
        console.error('Failed to refetch weeks after delete error:', refetchErr);
      }
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
      case 'ppt':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
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
          <h1 className="text-2xl font-bold text-white mb-4">Weeks & Career Resources</h1>
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
          <h1 className="text-2xl font-bold text-white mb-4">Weeks & Career Resources</h1>
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => refetchWeeks(true)}
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
    <div className="space-y-12">
      {/* Header */}
      <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white mb-1">Weeks & Career Resources</h1>
        <p className="text-gray-300">
          View weekly content and materials from program visits, plus career guidance resources.
        </p>
      </div>

      {/* Section 1: Weeks */}
      <section id="weeks" className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Weeks</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeks.map((week) => (
              <WeekWidget 
                key={week.id} 
                week={week} 
                isAdmin={isAdmin} 
                onEdit={handleEditWeek} 
                onDelete={handleDeleteWeek} 
                isDeleting={isDeleting === week.id}
                onClick={() => setSelectedWeek(week)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Barrier / Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px bg-gray-700 flex-1" />
        <span className="text-gray-400 text-sm">Career Guidance Resources</span>
        <div className="h-px bg-gray-700 flex-1" />
      </div>

      {/* Section 2: Career Resources */}
      <section id="career-resources" className="space-y-6">
        {careerResourcesLoading ? (
          <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          </div>
        ) : careerResources.length === 0 ? (
          <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400">No career resources available yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careerResources.map((res) => (
              <div key={res.id} className="bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass overflow-hidden">
                <div className="p-4 border-b border-glass flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold leading-tight">{res.title}</h3>
                    {res.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{res.description}</p>
                    )}
                  </div>
                  <div className="text-gray-300" title={res.resource_type}>
                    {getFileTypeIcon(res.resource_type)}
                  </div>
                </div>
                <div className="p-4">
                  {res.resource_type === 'text' ? (
                    <p className="text-gray-300 whitespace-pre-wrap text-sm">{res.content_text}</p>
                  ) : (
                    <div className="space-y-2">
                      {res.career_resource_files?.map((f) => (
                        <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg border border-glass">
                          <div className="flex items-center gap-2 text-gray-200">
                            {getFileTypeIcon(f.file_type)}
                            <span className="text-sm">{f.file_name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{Math.round(((f.file_size || 0)/1024))} KB</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {selectedWeek && (
        <WeekModal 
          week={selectedWeek}
          isOpen={true}
          onClose={closeWeekModal}
        />
      )}

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