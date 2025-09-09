import { supabase } from '@/lib/supabase';

export const getAuthenticatedHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return headers;
};

export const api = {
  get: async (url: string) => {
    const headers = await getAuthenticatedHeaders();
    const response = await fetch(url, { headers });
    return response.json();
  },
  post: async (url: string, body: unknown) => {
    const headers = await getAuthenticatedHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return response.json();
  },
  put: async (url: string, body: unknown) => {
    const headers = await getAuthenticatedHeaders();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return response.json();
  },
  delete: async (url: string) => {
    const headers = await getAuthenticatedHeaders();
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    return response.json();
  },
};
