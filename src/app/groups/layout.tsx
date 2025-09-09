'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Optional: Redirect to appropriate dashboard if user prefers
      // Uncomment the lines below if you want to redirect users to their dashboards instead
      // if (isAdmin) {
      //   router.push('/admin/dashboard');
      //   return;
      // } else {
      //   router.push('/student/dashboard');
      //   return;
      // }
    }
  }, [user, isAdmin, isLoading, isInitialized, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500/30 border-t-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}