'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface UseSupabaseDataOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

interface UseSupabaseDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupabaseData<T>(
  fetcher: () => Promise<T>,
  options: UseSupabaseDataOptions = {}
): UseSupabaseDataReturn<T> {
  const { enabled = true, refetchOnMount = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fetcherRef = useRef(fetcher);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled || !mounted) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [enabled, mounted]);

  useEffect(() => {
    if (mounted && enabled && refetchOnMount) {
      fetchData();
    } else if (mounted) {
      setLoading(false);
    }
  }, [mounted, enabled, refetchOnMount, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Specific hook for authenticated API calls
export function useAuthenticatedAPI<T>(
  endpoint: string,
  options: UseSupabaseDataOptions = {}
): UseSupabaseDataReturn<T> {
  const { user, isInitialized } = useAuth();
  
  const fetcher = useCallback(async (): Promise<T> => {
    if (!user) throw new Error('User not authenticated');
    
    // Get the actual session token from Supabase
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No valid session token');
    }
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'API call failed');
    }
    
    return response.json();
  }, [endpoint, user]);

  return useSupabaseData(fetcher, {
    ...options,
    enabled: options.enabled !== false && !!user && isInitialized,
  });
}
