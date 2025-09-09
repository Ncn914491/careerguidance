'use client';

import { supabase } from './supabase';

/**
 * Make authenticated API requests with proper session handling
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No authentication session found');
  }

  // Add authorization header
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make authenticated API requests with FormData (for file uploads)
 */
export async function authenticatedFormFetch(
  url: string, 
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No authentication session found');
  }

  // Add authorization header (don't set Content-Type for FormData)
  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: formData,
  });
}

/**
 * Handle API response with proper error handling
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}