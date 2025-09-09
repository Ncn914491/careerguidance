'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export function AuthRedirect() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Wait for auth to load
    }

    // If user is logged in and on home page, redirect to appropriate dashboard
    if (user && role && window.location.pathname === '/') {
      const targetPath = role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      console.log('Redirecting authenticated user to:', targetPath);
      router.push(targetPath);
    }
  }, [user, role, isLoading, router]);

  return null; // This component doesn't render anything
}