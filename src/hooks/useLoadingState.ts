'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingStateOptions {
  timeout?: number;
  onTimeout?: () => void;
}

export function useLoadingState(initialState = false, options: LoadingStateOptions = {}) {
  const [isLoading, setIsLoading] = useState(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { timeout = 30000, onTimeout } = options;

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set timeout for loading state
    if (loading && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        onTimeout?.();
      }, timeout);
    }
  }, [timeout, onTimeout]);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    setLoading,
    withLoading
  };
}