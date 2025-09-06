'use client';

import { useEffect, useState } from 'react';

interface LoadingFallbackProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}

export default function LoadingFallback({ 
  message = "Loading...", 
  timeout = 10000,
  onTimeout 
}: LoadingFallbackProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
        onTimeout?.();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-yellow-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-300 text-sm">Taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
    </div>
  );
}