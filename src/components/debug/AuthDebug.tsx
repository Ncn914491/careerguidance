'use client';

import { useAuth } from '@/components/providers/AuthProvider';

export function AuthDebug() {
  const auth = useAuth();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Don't render in production builds at all
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>User: {auth.user?.email || 'None'}</div>
        <div>Role: {auth.role || 'None'}</div>
        <div>Is Loading: {auth.isLoading ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
}
