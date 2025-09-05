'use client';

import { Suspense, ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function LazyWrapper({ children, fallback, className = '' }: LazyWrapperProps) {
  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size="lg" text="Loading component..." />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}