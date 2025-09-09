'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';

interface UseSupabaseQueryOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

/**
 * Custom hook for caching Supabase queries with SWR
 */
export function useSupabaseQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseSupabaseQueryOptions = {}
) {
  const { user } = useAuth();
  
  const {
    data,
    error,
    mutate,
    isLoading,
    isValidating
  } = useSWR(
    user && key ? `${user.id}-${key}` : null,
    fetcher,
    {
      revalidateOnFocus: options.revalidateOnFocus ?? false,
      revalidateOnReconnect: options.revalidateOnReconnect ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      ...options
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  };
}

/**
 * Hook for fetching groups with caching
 */
export function useGroups() {
  return useSupabaseQuery(
    'groups',
    async () => {
      const { api } = await import('@/lib/api');
      const data = await api.get('/api/groups');
      if (data.error) {
        throw new Error(data.error);
      }
      return data.groups || [];
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  );
}

/**
 * Hook for fetching user profile with caching
 */
export function useProfile() {
  const { user } = useAuth();
  
  return useSupabaseQuery(
    user ? 'profile' : null,
    async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  );
}

/**
 * Hook for fetching weeks data with caching
 */
export function useWeeks() {
  return useSupabaseQuery(
    'weeks',
    async () => {
      const response = await fetch('/api/weeks');
      if (!response.ok) {
        throw new Error('Failed to fetch weeks');
      }
      const data = await response.json();
      return data.weeks || [];
    },
    {
      revalidateOnFocus: true
    }
  );
}