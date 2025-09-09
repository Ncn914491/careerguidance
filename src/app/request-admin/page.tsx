'use client';

import { useState, useEffect } from 'react';
import AdminRequestForm from '@/components/AdminRequestForm';
import { useAuth } from '@/components/providers/AuthProvider';

export default function RequestAdminPage() {
  const { user, isAdmin, isInitialized, isLoading: authLoading } = useAuth();
  const [isPendingAdmin, setIsPendingAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading state based on authLoading and isInitialized
    setIsLoading(authLoading || !isInitialized);
    
    // Check if user is pending admin (this would typically come from user metadata or a profile table)
    // For now, we'll assume it's false unless explicitly set elsewhere
    setIsPendingAdmin(false); // Placeholder - implement actual check if needed

  }, [user, isAdmin, isInitialized, authLoading]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass animate-fade-in">
          <div className="animate-pulse">
            <div className="h-8 bg-glass rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-glass rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass text-center animate-fade-in">
          <div className="text-blue-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300">Please log in to request admin access.</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass text-center animate-fade-in">
          <div className="text-green-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Already an Admin</h1>
          <p className="text-gray-300 mb-6">You already have admin privileges.</p>
          <a 
            href="/admin" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-glass hover:shadow-glass-lg"
          >
            Go to Admin Panel
          </a>
        </div>
      </div>
    );
  }

  if (isPendingAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass text-center animate-fade-in">
          <div className="text-yellow-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Admin Request Pending</h1>
          <p className="text-gray-300 mb-6">Your admin request is currently being reviewed. You'll be notified once it's processed.</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/student" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-glass hover:shadow-glass-lg"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminRequestForm />
    </div>
  );
}
