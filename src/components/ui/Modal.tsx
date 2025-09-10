'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass-lg
        w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
        animate-slide-in transform transition-all duration-300
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-glass">
          <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-glass-dark transform hover:scale-110 active:scale-95"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}