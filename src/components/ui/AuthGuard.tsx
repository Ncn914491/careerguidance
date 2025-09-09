'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo 
}: AuthGuardProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth is loaded
    if (isLoading) return;

    if (requireAuth && !user) {
      router.push(redirectTo || '/login');
      return;
    }

    if (requireAdmin && (!user || role !== 'admin')) {
      router.push('/login');
      return;
    }
  }, [user, role, isLoading, requireAuth, requireAdmin, redirectTo, router]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !user) return null;
  if (requireAdmin && (!user || role !== 'admin')) return null;

  return <>{children}</>;
}