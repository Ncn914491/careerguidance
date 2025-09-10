'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Ensure profile exists using utility function
            const { ensureProfileExists } = await import('@/lib/profile-utils');
            const profileCreated = await ensureProfileExists(data.user);

            if (!profileCreated) {
              console.warn('Profile creation failed, but continuing with login');
            }

            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to dashboard...');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/student/dashboard');
            }, 2000);
          }
        } else {
          throw new Error('Invalid confirmation link');
        }
      } catch (error: unknown) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage((error instanceof Error ? error.message : String(error)) || 'Failed to confirm email');
        
        // Redirect to login after error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-glass backdrop-blur-md rounded-xl shadow-glass-lg border border-glass p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirming Email</h2>
              <p className="text-gray-300">Please wait while we confirm your email address...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Confirmed!</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-500 text-5xl mb-4">✗</div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirmation Failed</h2>
              <p className="text-gray-300 mb-4">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}